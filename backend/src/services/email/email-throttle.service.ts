import redisConnection from '../../config/redis.js';

const LOCK_KEY = 'email:throttle:lock';
const LAST_SEND_KEY = 'email:throttle:last-send';

function getMinDelayMs() {
  const rawDelay = process.env.EMAIL_MIN_DELAY_MS ?? '2000';
  const parsedDelay = Number(rawDelay);

  if (!Number.isInteger(parsedDelay) || parsedDelay < 0) {
    throw new Error(
      `Invalid EMAIL_MIN_DELAY_MS value "${rawDelay}". Expected a non-negative integer.`,
    );
  }

  return parsedDelay;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function acquireLock(lockValue: string) {
  while (true) {
    const acquired = await redisConnection.set(
      LOCK_KEY,
      lockValue,
      'PX',
      30_000,
      'NX',
    );

    if (acquired === 'OK') {
      return;
    }

    await sleep(50);
  }
}

async function releaseLock(lockValue: string) {
  const script = `
    if redis.call('GET', KEYS[1]) == ARGV[1] then
      return redis.call('DEL', KEYS[1])
    end

    return 0
  `;

  await redisConnection.eval(
    script,
    1,
    LOCK_KEY,
    lockValue,
  );
}

export async function withEmailSendThrottle<T>(
  send: () => Promise<T>,
): Promise<T> {
  const minDelayMs = getMinDelayMs();
  const lockValue = `${process.pid}-${Date.now()}-${Math.random()}`;

  await acquireLock(lockValue);

  try {
    const lastSendRaw = await redisConnection.get(
      LAST_SEND_KEY,
    );

    if (lastSendRaw) {
      const lastSendTime = Number(lastSendRaw);
      const elapsed = Date.now() - lastSendTime;

      const remainingDelay = minDelayMs - elapsed;

      if (remainingDelay > 0) {
        await sleep(remainingDelay);
      }
    }

    const result = await send();

    await redisConnection.set(
      LAST_SEND_KEY,
      String(Date.now()),
    );

    return result;
  } finally {
    await releaseLock(lockValue);
  }
}