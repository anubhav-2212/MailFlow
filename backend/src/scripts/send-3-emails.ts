console.log("SCRIPT STARTED");
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
    data: [
      {
        campaignId: campaign.id,
        senderId: sender.id,
        recipient: "recipient1@example.com",
        subject: "ReachInbox Test 1",
        body: "This is test email 1.",
        scheduledAt: new Date(),
        status: "SCHEDULED",
        sequenceNumber: 1,
      },
      {
        campaignId: campaign.id,
        senderId: sender.id,
        recipient: "recipient2@example.com",
        subject: "ReachInbox Test 2",
        body: "This is test email 2.",
        scheduledAt: new Date(),
        status: "SCHEDULED",
        sequenceNumber: 2,
      },
      {
        campaignId: campaign.id,
        senderId: sender.id,
        recipient: "recipient3@example.com",
        subject: "ReachInbox Test 3",
        body: "This is test email 3.",
        scheduledAt: new Date(),
        status: "SCHEDULED",
        sequenceNumber: 3,
      },
    ],
  });

  console.log(`Created ${emails.count} emails.`);
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });