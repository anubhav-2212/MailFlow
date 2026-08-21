import redisConnection from '../../config/redis.js';

function getMaxEmailsPerHour() {
  const rawLimit = process.env.EMAIL_MAX_PER_HOUR ?? '200';
  const parsedLimit = Number(rawLimit);

  if (!Number.isInteger(parsedLimit) || parsedLimit < 1) {
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

export async function consumeHourlyEmailSlot() {
  const limit = getMaxEmailsPerHour();
  const window = getHourWindow();

  const key = `email:rate-limit:${window}`;

  const count = await redisConnection.incr(key);

  if (count === 1) {
    await redisConnection.expire(key, 60 * 60);
  }

  if (count <= limit) {
    return {
      allowed: true,
      count,
      limit,
      retryAt: null,
    };
  }

  await redisConnection.decr(key);

  const nextHour = new Date();

  nextHour.setUTCMinutes(0, 0, 0);
  nextHour.setUTCHours(nextHour.getUTCHours() + 1);

  return {
    allowed: false,
    count: limit,
    limit,
    retryAt: nextHour,
  };
}