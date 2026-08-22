import redisConnection from '../../config/redis.js';

function getMaxEmailsPerHour() {
  const rawLimit =
    process.env.EMAIL_MAX_PER_HOUR ?? '200';

  const parsedLimit = Number(rawLimit);

  if (
    !Number.isInteger(parsedLimit) ||
    parsedLimit < 1
  ) {
    throw new Error(
      `Invalid EMAIL_MAX_PER_HOUR value "${rawLimit}". Expected a positive integer.`,
    );
  }

  return parsedLimit;
}

function getHourWindow() {
  const now = new Date();

  return [
    now.getUTCFullYear(),
    String(now.getUTCMonth() + 1).padStart(2, '0'),
    String(now.getUTCDate()).padStart(2, '0'),
    String(now.getUTCHours()).padStart(2, '0'),
  ].join('-');
}

export async function consumeHourlyEmailSlot(
  senderId: string,
  campaignHourlyLimit: number,
) {
  // ----------------------------------------
  // 1. Get global safety limit
  // ----------------------------------------

  const globalLimit = getMaxEmailsPerHour();

  // ----------------------------------------
  // 2. Validate campaign limit
  // ----------------------------------------

  if (
    !Number.isInteger(campaignHourlyLimit) ||
    campaignHourlyLimit < 1
  ) {
    throw new Error(
      `Invalid campaign hourly limit "${campaignHourlyLimit}". Expected a positive integer.`,
    );
  }

  // ----------------------------------------
  // 3. Effective hourly limit
  //
  // Campaign can choose a lower limit,
  // but cannot exceed the global safety limit.
  // ----------------------------------------

  const limit = Math.min(
    campaignHourlyLimit,
    globalLimit,
  );

  // ----------------------------------------
  // 4. Current UTC hour window
  // ----------------------------------------

  const window = getHourWindow();

  // Each sender gets an independent Redis
  // counter for each UTC hour.
  const key =
    `email:rate-limit:${senderId}:${window}`;

  // ----------------------------------------
  // 5. Atomically consume a slot
  // ----------------------------------------

  const count =
    await redisConnection.incr(key);

  // Set expiry only when the key is first created.
  if (count === 1) {
    await redisConnection.expire(
      key,
      60 * 60,
    );
  }

  // ----------------------------------------
  // 6. Limit not reached
  // ----------------------------------------

  if (count <= limit) {
    return {
      allowed: true,
      count,
      limit,
      retryAt: null,
    };
  }

  // ----------------------------------------
  // 7. Limit reached
  //
  // This email did not actually consume
  // a sending slot, so undo the increment.
  // ----------------------------------------

  await redisConnection.decr(key);

  // ----------------------------------------
  // 8. Calculate next UTC hour
  // ----------------------------------------

  const nextHour = new Date();

  nextHour.setUTCMinutes(0, 0, 0);

  nextHour.setUTCHours(
    nextHour.getUTCHours() + 1,
  );

  // ----------------------------------------
  // 9. Return rescheduling information
  // ----------------------------------------

  return {
    allowed: false,
    count: limit,
    limit,
    retryAt: nextHour,
  };
}