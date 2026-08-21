import "dotenv/config";

import prisma from "../config/prisma.js";

async function main() {
  console.log("");
  console.log("========================================");
  console.log("     🚦 RATE LIMIT EMAIL SETUP");
  console.log("========================================");

  const sender = await prisma.sender.findFirst();

  if (!sender) {
    throw new Error("No sender found.");
  }

  const campaign = await prisma.campaign.findFirst();

  if (!campaign) {
    throw new Error("No campaign found.");
  }

  console.log("");
  console.log(`Sender   : ${sender.id}`);
  console.log(`Campaign : ${campaign.id}`);

  console.log("");
  console.log("Creating 3 emails...");
  console.log("");

  const emails = await prisma.email.createManyAndReturn({
    data: [
      {
        campaignId: campaign.id,
        senderId: sender.id,
        recipient: "rate-limit-1@example.com",
        subject: "Rate Limit Test 1",
        body: "Testing hourly rate limiting.",
        scheduledAt: new Date(),
        status: "SCHEDULED",
        attempts: 0,
        sequenceNumber: 10001,
      },
      {
        campaignId: campaign.id,
        senderId: sender.id,
        recipient: "rate-limit-2@example.com",
        subject: "Rate Limit Test 2",
        body: "Testing hourly rate limiting.",
        scheduledAt: new Date(),
        status: "SCHEDULED",
        attempts: 0,
        sequenceNumber: 10002,
      },
      {
        campaignId: campaign.id,
        senderId: sender.id,
        recipient: "rate-limit-3@example.com",
        subject: "Rate Limit Test 3",
        body: "Testing hourly rate limiting.",
        scheduledAt: new Date(),
        status: "SCHEDULED",
        attempts: 0,
        sequenceNumber: 10003,
      },
    ],
  });

  console.log(`Created ${emails.length} emails.`);
  console.log("");

  for (const email of emails) {
    console.log(`Email ID   : ${email.id}`);
    console.log(`Recipient  : ${email.recipient}`);
    console.log(`Status     : ${email.status}`);
    console.log("");
  }

  console.log("========================================");

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("");
  console.error("❌ Failed to create test emails");
  console.error(error);

  await prisma.$disconnect();

  process.exit(1);
});