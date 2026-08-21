import { EmailStatus } from '../../generated/prisma/enums.js';

import { logInfo, logWarn } from '../../lib/logger.js';

import { withEmailSendThrottle } from './email-throttle.service.js';

import {
  findEmailById,
  markEmailAsProcessingIfScheduled,
  markEmailAsScheduled,
  markEmailAsFailed,
  markEmailAsSent,
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

  // -----------------------------------------
  // 1. Find email
  // -----------------------------------------

  const email = await findEmailById(emailId);

  if (!email) {
    logWarn('email.worker.email_not_found', {
      jobId,
      emailId,
    });

    return;
  }

  // -----------------------------------------
  // 2. Idempotency check
  // -----------------------------------------
  // If this email has already been sent,
  // NEVER attempt to send it again.
  // -----------------------------------------

  if (email.status === EmailStatus.SENT) {
    logWarn('email.worker.email_already_sent', {
      jobId,
      emailId,
    });

    return;
  }

  // Only SCHEDULED emails can enter processing.

  if (email.status !== EmailStatus.SCHEDULED) {
    logWarn('email.worker.email_not_scheduled', {
      jobId,
      emailId,
      currentStatus: email.status,
    });

    return;
  }

  // -----------------------------------------
  // 3. Atomically claim the email
  // -----------------------------------------
  //
  // SCHEDULED → PROCESSING
  //
  // This prevents two workers from processing
  // the same email simultaneously.
  // -----------------------------------------

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

  // -----------------------------------------
  // 4. Check hourly rate limit
  // -----------------------------------------

  const rateLimit = await consumeHourlyEmailSlot();

  if (!rateLimit.allowed) {

    logWarn('email.worker.hourly_limit_reached', {
      jobId,
      emailId,
      limit: rateLimit.limit,
      retryAt: rateLimit.retryAt,
    });

    if (rateLimit.retryAt) {

      // PROCESSING → SCHEDULED
      //
      // We put the email back into a schedulable
      // state before creating the delayed job.

      await markEmailAsScheduled(
        emailId,
        rateLimit.retryAt,
      );

      // Create delayed BullMQ job.

      await rescheduleEmail(
        emailId,
        rateLimit.retryAt,
      );

      logInfo('email.worker.email_rescheduled', {
        jobId,
        emailId,
        retryAt: rateLimit.retryAt,
        reason: 'HOURLY_LIMIT',
      });
    }

    return;
  }

  // -----------------------------------------
  // 5. Send email
  // -----------------------------------------

  try {

    const result = await withEmailSendThrottle(() =>
      sendEmail({
        from: email.sender.email,
        to: email.recipient,
        subject: email.subject,
        text: email.body,
      }),
    );

    // ---------------------------------------
    // 6. Mark as SENT
    // ---------------------------------------
    //
    // PROCESSING → SENT
    //
    // This transition should be atomic inside
    // the repository.
    // ---------------------------------------

    await markEmailAsSent(emailId);

    logInfo('email.worker.email_sent', {
      jobId,
      emailId,
      messageId: result.messageId,
      previewUrl: result.previewUrl,
    });

  } catch (error) {

    // ---------------------------------------
    // 7. Mark as FAILED
    // ---------------------------------------

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
      error: errorMessage,
    });

    // Throw so BullMQ knows the job failed
    // and can apply its retry policy.

    throw error;
  }
}