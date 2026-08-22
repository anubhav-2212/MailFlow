import { EmailStatus } from '../../generated/prisma/enums.js';

import { logInfo, logWarn } from '../../lib/logger.js';

import { withEmailSendThrottle } from './email-throttle.service.js';

import {
  findEmailById,
  markEmailAsProcessingIfScheduled,
  markEmailAsFailed,
  markEmailAsSent,
  markEmailAsScheduled,
} from './email.repository.js';

import { sendEmail } from './smtp.service.js';

import { consumeHourlyEmailSlot } from './email-rate-limit.service.js';

import { rescheduleEmail } from '../../queue/email.queues.js';

interface ProcessEmailJobInput {
  emailId: string;
  jobId: string;
}

export async function processEmailSendingJob({
  emailId,
  jobId,
}: ProcessEmailJobInput) {

  // ----------------------------------------
  // 1. Find email
  // ----------------------------------------

  const email = await findEmailById(emailId);

  if (!email) {
    logWarn('email.worker.email_not_found', {
      jobId,
      emailId,
    });

    return;
  }

  // ----------------------------------------
  // 2. Only SCHEDULED emails can be processed
  // ----------------------------------------

  if (email.status !== EmailStatus.SCHEDULED) {
    logWarn('email.worker.email_not_scheduled', {
      jobId,
      emailId,
      currentStatus: email.status,
    });

    return;
  }

  // ----------------------------------------
  // 3. Atomically claim the email
  //
  // SCHEDULED → PROCESSING
  //
  // This protects against duplicate jobs.
  // ----------------------------------------

  const updateResult =
    await markEmailAsProcessingIfScheduled(emailId);

  if (updateResult.count === 0) {
    logWarn(
      'email.worker.email_state_transition_skipped',
      {
        jobId,
        emailId,
        fromStatus: EmailStatus.SCHEDULED,
        toStatus: EmailStatus.PROCESSING,
      },
    );

    return;
  }

  logInfo('email.worker.email_marked_processing', {
    jobId,
    emailId,
    fromStatus: EmailStatus.SCHEDULED,
    toStatus: EmailStatus.PROCESSING,
  });

  // ----------------------------------------
  // 4. Check PER-SENDER hourly limit
  // ----------------------------------------

  const rateLimit = await consumeHourlyEmailSlot(
    email.senderId,
    email.campaign.hourlyLimit, 
  );

  if (!rateLimit.allowed) {

    logWarn('email.worker.hourly_limit_reached', {
      jobId,
      emailId,
      senderId: email.senderId,
      limit: rateLimit.limit,
      retryAt: rateLimit.retryAt,
    });

    if (rateLimit.retryAt) {

      // PROCESSING → SCHEDULED

      await markEmailAsScheduled(
        emailId,
        rateLimit.retryAt,
      );

      // Schedule the email for the next hour

      await rescheduleEmail(
        emailId,
        rateLimit.retryAt,
      );

      logInfo(
        'email.worker.email_rescheduled',
        {
          jobId,
          emailId,
          senderId: email.senderId,
          retryAt: rateLimit.retryAt,
          reason: 'HOURLY_LIMIT',
        },
      );
    }

    return;
  }

  // ----------------------------------------
  // 5. Send email
  // ----------------------------------------

  try {

    const result = await withEmailSendThrottle(
      () =>
        sendEmail({
          from: email.sender.email,
          to: email.recipient,
          subject: email.subject,
          text: email.body,
        }),
    );

    // --------------------------------------
    // 6. PROCESSING → SENT
    // --------------------------------------

    await markEmailAsSent(emailId);

    logInfo('email.worker.email_sent', {
      jobId,
      emailId,
      senderId: email.senderId,
      messageId: result.messageId,
      previewUrl: result.previewUrl,
    });

  } catch (error) {

    // --------------------------------------
    // 7. PROCESSING → FAILED
    // --------------------------------------

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown email error';

    await markEmailAsFailed(
      emailId,
      errorMessage,
    );

    logWarn('email.worker.email_failed', {
      jobId,
      emailId,
      senderId: email.senderId,
      error: errorMessage,
    });

    // Let BullMQ handle the failed job

    throw error;
  }
}