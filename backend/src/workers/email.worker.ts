import "dotenv/config";
import prisma from "../config/prisma.js";

import { Worker, type Job } from 'bullmq';

import redisConnection from '../config/redis.js';
import { logError, logInfo } from '../lib/logger.js';
import { EMAIL_QUEUE_NAME } from '../queue/email.queues.js';
import type { SendEmailJobData } from '../queue/queues.types.js';
import {
  processEmailSendingJob,
} from '../services/email/email-processing.service.js';

import {
  markEmailAsFailed,
} from '../services/email/email.repository.js';

import { updateCampaignStatus } from '../services/campaign.service.js';
function getWorkerConcurrency() {
  const rawConcurrency =
    process.env.EMAIL_WORKER_CONCURRENCY ?? '1';

  const parsedConcurrency = Number(rawConcurrency);

  if (
    !Number.isInteger(parsedConcurrency) ||
    parsedConcurrency < 1
  ) {
    throw new Error(
      `Invalid EMAIL_WORKER_CONCURRENCY value "${rawConcurrency}". Expected a positive integer.`,
    );
  }

  return parsedConcurrency;
}

const workerConcurrency = getWorkerConcurrency();

const emailWorker = new Worker<SendEmailJobData>(
  EMAIL_QUEUE_NAME,

  async (job: Job<SendEmailJobData>) => {
    logInfo('email.worker.job_started', {
      jobId: String(job.id),
      queueName: EMAIL_QUEUE_NAME,
      emailId: job.data.emailId,
    });

    await processEmailSendingJob({
      emailId: job.data.emailId,
      jobId: String(job.id),
    });

    logInfo('email.worker.job_completed', {
      jobId: String(job.id),
      queueName: EMAIL_QUEUE_NAME,
      emailId: job.data.emailId,
    });
  },

  {
    connection: redisConnection,
    concurrency: workerConcurrency,
  },
);

// ----------------------------------------
// Worker ready
// ----------------------------------------

emailWorker.on('ready', () => {
  logInfo('email.worker.ready', {
    queueName: EMAIL_QUEUE_NAME,
    concurrency: workerConcurrency,
  });
});

// ----------------------------------------
// Job active
// ----------------------------------------

emailWorker.on('active', (job) => {
  logInfo('email.worker.job_active', {
    jobId: String(job.id),
    queueName: EMAIL_QUEUE_NAME,
    emailId: job.data.emailId,
  });
});

// ----------------------------------------
// Job completed
// ----------------------------------------

emailWorker.on('completed', (job) => {
  logInfo('email.worker.job_acknowledged', {
    jobId: String(job.id),
    queueName: EMAIL_QUEUE_NAME,
    emailId: job.data.emailId,
  });
});

// ----------------------------------------
// Job failed
// ----------------------------------------

emailWorker.on('failed', async (job, error) => {
  if (!job) {
    logError(
      'email.worker.job_failed',
      error,
      {
        jobId: 'unknown',
        queueName: EMAIL_QUEUE_NAME,
      },
    );

    return;
  }

  const emailId = job.data.emailId;
  const jobId = String(job.id);

  logError(
    'email.worker.job_failed',
    error,
    {
      jobId,
      queueName: EMAIL_QUEUE_NAME,
      emailId,
      attemptsMade: job.attemptsMade,
      maxAttempts: job.opts.attempts ?? 1,
    },
  );

  // ----------------------------------------
  // Only mark the email FAILED when BullMQ
  // has exhausted all configured attempts.
  // ----------------------------------------

  const maxAttempts = job.opts.attempts ?? 1;

  if (job.attemptsMade < maxAttempts) {
    logInfo('email.worker.job_retry_pending', {
      jobId,
      emailId,
      attemptsMade: job.attemptsMade,
      maxAttempts,
    });

    return;
  }

  // ----------------------------------------
  // FINAL ATTEMPT FAILED
  // ----------------------------------------

  const errorMessage =
    error instanceof Error
      ? error.message
      : 'Unknown email error';

  await markEmailAsFailed(
    emailId,
    errorMessage,
  );

  logInfo('email.worker.email_marked_failed', {
    jobId,
    emailId,
    attemptsMade: job.attemptsMade,
    maxAttempts,
    error: errorMessage,
  });

  // ----------------------------------------
  // Recalculate campaign status
  // ----------------------------------------

  const email = await prisma.email.findUnique({
    where: {
      id: emailId,
    },
    select: {
      campaignId: true,
    },
  });

  if (email) {
    await updateCampaignStatus(
      email.campaignId,
    );
  }
});

// ----------------------------------------
// Graceful shutdown
// ----------------------------------------

async function shutdown(signal: string) {
  logInfo('email.worker.shutdown_started', {
    signal,
  });

  await emailWorker.close();

  await redisConnection.quit();

  logInfo('email.worker.shutdown_completed', {
    signal,
  });
}

process.on('SIGINT', async () => {
  await shutdown('SIGINT');

  process.exit(0);
});

process.on('SIGTERM', async () => {
  await shutdown('SIGTERM');

  process.exit(0);
});

// ----------------------------------------
// Worker boot
// ----------------------------------------

logInfo('email.worker.booted', {
  queueName: EMAIL_QUEUE_NAME,
  concurrency: workerConcurrency,
});