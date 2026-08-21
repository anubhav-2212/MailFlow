import { EmailStatus } from '../../generated/prisma/enums.js';

import { logInfo, logWarn } from '../../lib/logger.js';
import { withEmailSendThrottle } from './email-throttle.service.js';

import { findEmailById, markEmailAsProcessingIfScheduled ,markEmailAsFailed,markEmailAsSent} from './email.repository.js';
import {sendEmail} from './smtp.service.js';
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
  const email = await findEmailById(emailId);

  if (!email) {
    logWarn('email.worker.email_not_found', {
      jobId,
      emailId,
    });

    return;
  }

  if (email.status !== EmailStatus.SCHEDULED) {
    logWarn('email.worker.email_not_scheduled', {
      jobId,
      emailId,
      currentStatus: email.status,
    });

    return;
  }
const rateLimit = await consumeHourlyEmailSlot();

if (!rateLimit.allowed) {
  logWarn('email.worker.hourly_limit_reached', {
    jobId,
    emailId,
    limit: rateLimit.limit,
    retryAt: rateLimit.retryAt,
  });

  if (rateLimit.retryAt) {
    await rescheduleEmail(emailId, rateLimit.retryAt);
  }

  return;
}
  const updateResult = await markEmailAsProcessingIfScheduled(emailId);

  if (updateResult.count === 0) {
    logWarn('email.worker.email_state_transition_skipped', {
      jobId,
      emailId,
      fromStatus: EmailStatus.SCHEDULED,
      toStatus: EmailStatus.PROCESSING,
    });

    return;
  }

  logInfo('email.worker.email_marked_processing', {
    jobId,
    emailId,
    fromStatus: EmailStatus.SCHEDULED,
    toStatus: EmailStatus.PROCESSING,
  });
  try{
 const result = await withEmailSendThrottle(() =>
  sendEmail({
    from: email.sender.email,
    to: email.recipient,
    subject: email.subject,
    text: email.body,
  }),
);

    await markEmailAsSent(emailId);

    logInfo('email.worker.email_sent', {
      jobId,
      emailId,
      messageId: result.messageId,
      previewUrl: result.previewUrl,
    });
  } catch (error) {
    await markEmailAsFailed(
      emailId,
      error instanceof Error ? error.message : 'Unknown email error',
    );

    throw error;
  }
}
