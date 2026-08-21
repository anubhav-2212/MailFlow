import { EmailStatus } from '../../generated/prisma/enums.js';

import { logInfo, logWarn } from '../../lib/logger.js';

import { findEmailById, markEmailAsProcessingIfScheduled } from './email.repository.js';

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
}
