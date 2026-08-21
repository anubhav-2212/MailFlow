import { Worker, type Job } from 'bullmq';

import redisConnection from '../config/redis.js';
import { logError, logInfo } from '../lib/logger.js';
import { EMAIL_QUEUE_NAME } from '../queue/email.queues.js';
import type { SendEmailJobData } from '../queue/queues.types.js';
import { processEmailSendingJob } from '../services/email/email-processing.service.js';

function getWorkerConcurrency() {
  const rawConcurrency = process.env.EMAIL_WORKER_CONCURRENCY ?? '1';
  const parsedConcurrency = Number(rawConcurrency);

  if (!Number.isInteger(parsedConcurrency) || parsedConcurrency < 1) {
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

emailWorker.on('ready', () => {
  logInfo('email.worker.ready', {
    queueName: EMAIL_QUEUE_NAME,
    concurrency: workerConcurrency,
  });
});

emailWorker.on('active', (job) => {
  logInfo('email.worker.job_active', {
    jobId: String(job.id),
    queueName: EMAIL_QUEUE_NAME,
    emailId: job.data.emailId,
  });
});

emailWorker.on('completed', (job) => {
  logInfo('email.worker.job_acknowledged', {
    jobId: String(job.id),
    queueName: EMAIL_QUEUE_NAME,
    emailId: job.data.emailId,
  });
});

emailWorker.on('failed', (job, error) => {
  logError('email.worker.job_failed', error, {
    jobId: job ? String(job.id) : 'unknown',
    queueName: EMAIL_QUEUE_NAME,
    emailId: job?.data.emailId,
  });
});

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

logInfo('email.worker.booted', {
  queueName: EMAIL_QUEUE_NAME,
  concurrency: workerConcurrency,
});
