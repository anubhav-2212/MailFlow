import redisConnection from '../../config/redis.js';

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

const LAST_SEND_KEY = 'email:throttle:next-send';

const RESERVE_NEXT_SEND_TIME_SCRIPT = `
local key = KEYS[1]
local now = tonumber(ARGV[1])
local delay = tonumber(ARGV[2])

local nextSend = tonumber(redis.call('GET', key) or '0')

if nextSend < now then
  nextSend = now
end

local reservedTime = nextSend + delay

redis.call('SET', key, reservedTime)

return nextSend
`;

export async function waitForMinimumSendDelay() {
  const minDelayMs = getMinDelayMs();
  const now = Date.now();

  const allowedTime = Number(
    await redisConnection.eval(
      RESERVE_NEXT_SEND_TIME_SCRIPT,
      1,
      LAST_SEND_KEY,
      now,
      minDelayMs,
    ),
  );

  const waitMs = Math.max(0, allowedTime - now);

  if (waitMs > 0) {
    await new Promise((resolve) => setTimeout(resolve, waitMs));
  }
}