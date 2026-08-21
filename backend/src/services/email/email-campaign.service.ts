import prisma from "../../config/prisma.js";
import { scheduleEmail } from "../../queue/email.queues.js";

interface CreateCampaignEmailsInput {
  campaignId: string;
  senderId: string;
  recipients: string[];
}

export async function createCampaignEmails(
  input: CreateCampaignEmailsInput,
) {

  // 1. Find campaign
  const campaign = await prisma.campaign.findUnique({
    where: {
      id: input.campaignId,
    },
  });

  if (!campaign) {
    throw new Error("Campaign not found");
  }
  // 2. Find sender
  const sender = await prisma.sender.findUnique({
    where: {
      id: input.senderId,
    },
  });

  if (!sender) {
    throw new Error("Sender not found");
  }

  // 3. Make sure sender belongs to campaign owner

  if (sender.userId !== campaign.userId) {
    throw new Error(
      "Sender does not belong to campaign owner",
    );
  }
  // 4. Validate recipients
  if (input.recipients.length === 0) {
    throw new Error(
      "At least one recipient is required",
    );
  }
  // 5. Create emails
  const emails = [];

  for (let index = 0; index < input.recipients.length; index++) {
    const recipient = input.recipients[index];

    // TypeScript knows the array should contain strings,
    // but with noUncheckedIndexedAccess enabled,
    // indexed access can still be undefined.
    if (!recipient) {
      throw new Error(
        `Recipient at index ${index} is invalid`,
      );
    }

    const scheduledAt = new Date(
      campaign.startTime.getTime() +
        index * campaign.delayMs,
    );

    const email = await prisma.email.create({
      data: {
        campaignId: campaign.id,
        senderId: sender.id,

        recipient,

        subject: campaign.subject,
        body: campaign.body,

        scheduledAt,

        sequenceNumber: index + 1,
      },
    });

    emails.push(email);

    // 6. Schedule email in BullMQ


    await scheduleEmail(
      email.id,
      scheduledAt,
    );
  }

  return emails;
}