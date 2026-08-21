import { Queue } from 'bullmq';

import redisConnection from '../config/redis.js';

import type { SendEmailJobData } from './queues.types.js';

export const EMAIL_QUEUE_NAME = 'email-sending';

export const emailQueue = new Queue<SendEmailJobData>(
  EMAIL_QUEUE_NAME,
  {
    connection: redisConnection,

    defaultJobOptions: {
      attempts: 3,

      backoff: {
        type: 'exponential',
        delay: 5000,
      },

      removeOnComplete: {
        count: 1000,
      },

      removeOnFail: {
        count: 5000,
      },
    },
  },
);

export async function scheduleEmail(
  emailId: string,
  scheduledAt: Date
) {
  const delay = Math.max(
    0,
    scheduledAt.getTime() - Date.now()
  );

  return emailQueue.add(
    "send-email",
    {
      emailId,
    },
    {
      jobId: `email-${emailId}`,
      delay,
    }
  );
}
export async function rescheduleEmail(
  emailId: string,
  scheduledAt: Date,
) {
  const delay = Math.max(
    0,
    scheduledAt.getTime() - Date.now(),
  );

  return emailQueue.add(
    'send-email',
    {
      emailId,
    },
    {
      jobId: `email-${emailId}-${scheduledAt.getTime()}`,
      delay,
    },
  );
}