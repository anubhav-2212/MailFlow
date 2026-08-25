import { EmailStatus } from '../../generated/prisma/enums.js';

import { logInfo, logWarn } from '../../lib/logger.js';

import { withEmailSendThrottle } from './email-throttle.service.js';

import {
  findEmailById,
  markEmailAsProcessingIfScheduled,
  markEmailAsSent,
  markEmailAsScheduled,
} from './email.repository.js';

import { sendEmail } from './smtp.service.js';

import { consumeHourlyEmailSlot } from './email-rate-limit.service.js';

import { rescheduleEmail } from '../../queue/email.queues.js';
import { updateCampaignStatus } from "../campaign.service.js";
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
  // 2. Validate email state
  //
  // SCHEDULED:
  //   Normal first attempt.
  //
  // PROCESSING:
  //   BullMQ retry after a previous send failure.
  //
  // SENT / FAILED:
  //   Nothing more to process.
  // ----------------------------------------

  if (
    email.status !== EmailStatus.SCHEDULED &&
    email.status !== EmailStatus.PROCESSING
  ) {
    logWarn('email.worker.email_not_processable', {
      jobId,
      emailId,
      currentStatus: email.status,
    });

    return;
  }

  // ----------------------------------------
  // 3. Claim SCHEDULED email
  //
  // SCHEDULED → PROCESSING
  //
  // On BullMQ retry the email is already
  // PROCESSING, so don't attempt to claim it again.
  // ----------------------------------------

  if (email.status === EmailStatus.SCHEDULED) {
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
  } else {
    // ----------------------------------------
    // BullMQ retry
    // ----------------------------------------

    logInfo('email.worker.email_retrying', {
      jobId,
      emailId,
      status: EmailStatus.PROCESSING,
    });
  }

  // ----------------------------------------
  // 4. Check per-sender hourly limit
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

      await rescheduleEmail(
        emailId,
        rateLimit.retryAt,
      );

      logInfo('email.worker.email_rescheduled', {
        jobId,
        emailId,
        senderId: email.senderId,
        retryAt: rateLimit.retryAt,
        reason: 'HOURLY_LIMIT',
      });
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
await updateCampaignStatus(email.campaignId);
    logInfo('email.worker.email_sent', {
      jobId,
      emailId,
      senderId: email.senderId,
      messageId: result.messageId,
      previewUrl: result.previewUrl,
    });
  } catch (error) {
    // --------------------------------------
    // 7. Send attempt failed
    //
    // IMPORTANT:
    //
    // Do NOT mark the email FAILED here.
    //
    // Throwing allows BullMQ to perform its
    // configured retries.
    //
    // The worker should decide when all attempts
    // have been exhausted.
    // --------------------------------------

    const errorMessage =
      error instanceof Error
        ? error.message
        : 'Unknown email error';

    logWarn('email.worker.email_attempt_failed', {
      jobId,
      emailId,
      senderId: email.senderId,
      error: errorMessage,
    });

    throw error;
  }
}