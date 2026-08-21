import "dotenv/config";

import prisma from "../config/prisma.js";

async function main() {
  console.log("");
  console.log("========================================");
  console.log("      🔐 IDEMPOTENCY EMAIL SETUP");
  console.log("========================================");

  // Get an existing sender
  const sender = await prisma.sender.findFirst();

  if (!sender) {
    throw new Error("No sender found in database.");
  }

  // Get an existing campaign
  const campaign = await prisma.campaign.findFirst();

  if (!campaign) {
    throw new Error("No campaign found in database.");
  }

  // Create ONE fresh email
  const email = await prisma.email.create({
    data: {
      campaignId: campaign.id,
      senderId: sender.id,

      recipient: "idempotency-test@example.com",

      subject: "ReachInbox Idempotency Test",

      body: "Testing duplicate email protection.",

      scheduledAt: new Date(),

      status: "SCHEDULED",

      attempts: 0,

      sequenceNumber: 9999,
    },
  });

  console.log("");
  console.log("✅ Fresh email created");
  console.log("");
  console.log(`Email ID   : ${email.id}`);
  console.log(`Recipient  : ${email.recipient}`);
  console.log(`Status     : ${email.status}`);
  console.log(`Campaign   : ${email.campaignId}`);
  console.log(`Sender     : ${email.senderId}`);
  console.log("");
  console.log("========================================");

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("");
  console.error("❌ Failed to create test email");
  console.error(error);

  await prisma.$disconnect();
  process.exit(1);
});