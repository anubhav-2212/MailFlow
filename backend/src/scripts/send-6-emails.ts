import "dotenv/config";

import prisma from "../config/prisma.js";

async function main() {
  const sender = await prisma.sender.findFirst();
  const campaign = await prisma.campaign.findFirst();

  if (!sender) {
    throw new Error("No Sender found.");
  }

  if (!campaign) {
    throw new Error("No Campaign found.");
  }

  const emails = await prisma.email.createMany({
    data: Array.from({ length: 6 }, (_, index) => ({
      campaignId: campaign.id,
      senderId: sender.id,
      recipient: `recipient${index + 1}@example.com`,
      subject: `Rate Limit Test ${index + 1}`,
      body: `This is rate limit test email ${index + 1}.`,
      scheduledAt: new Date(),
      status: "SCHEDULED" as const,
      sequenceNumber: 100 + index,
    })),
  });

  console.log(`Created ${emails.count} emails.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });