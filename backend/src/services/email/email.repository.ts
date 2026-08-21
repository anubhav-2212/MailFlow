import type { Email } from '../../generated/prisma/client.js';
import { EmailStatus } from '../../generated/prisma/enums.js';

import prisma from '../../config/prisma.js';

export async function findEmailById(emailId: string): Promise<Email | null> {
  return prisma.email.findUnique({
    where: {
      id: emailId,
    },
  });
}

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
