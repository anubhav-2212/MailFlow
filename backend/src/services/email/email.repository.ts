
import { EmailStatus } from '../../generated/prisma/enums.js';

import prisma from '../../config/prisma.js';
//finding email by id for job processing 
export async function findEmailById(emailId: string) {
  return prisma.email.findUnique({
    where: {
      id: emailId,
    },
    include: {
      sender: true,
    },
  });
}
//marking email as processing if scheduled
export async function markEmailAsProcessingIfScheduled(emailId: string) {
  return prisma.email.updateMany({
    where: {
      id: emailId,
      status: EmailStatus.SCHEDULED,
    },
    data: {
      status: EmailStatus.PROCESSING,
    },
  });
}
//markEmail as sent if the email is succefully sent
export async function markEmailAsSent(emailId: string) {
  return prisma.email.updateMany({
    where: {
      id: emailId,
      status: EmailStatus.PROCESSING,
    },
    data: {
      status: EmailStatus.SENT,
      sentAt: new Date(),
      error: null,
    },
  });
}

export async function markEmailAsFailed(
  emailId: string,
  error: string,
) {
  return prisma.email.updateMany({
    where: {
      id: emailId,
      status: EmailStatus.PROCESSING,
    },
    data: {
      status: EmailStatus.FAILED,
      error,
    },
  });
}
export async function markEmailAsScheduled(
  emailId: string,
  scheduledAt: Date,
) {
  return prisma.email.updateMany({
    where: {
      id: emailId,
      status: EmailStatus.PROCESSING,
    },

    data: {
      status: EmailStatus.SCHEDULED,
      scheduledAt,
    },
  });
}