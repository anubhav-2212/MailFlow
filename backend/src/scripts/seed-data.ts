import "dotenv/config";

import prisma from "../config/prisma.js";

async function main() {
  // 1. Create User
  const user = await prisma.user.create({
    data: {
      googleId: "test-google-id-001",
      email: "testuser@example.com",
      name: "Test User",
      avatar: null,
    },
  });

  // 2. Create Sender
  const sender = await prisma.sender.create({
    data: {
      userId: user.id,
      email: process.env.ETHEREAL_SMTP_USER!,
      etherealUser: process.env.ETHEREAL_SMTP_USER!,
      etherealPassword: process.env.ETHEREAL_SMTP_PASSWORD!,
      hourlyLimit: 200,
    },
  });

  // 3. Create Campaign
  const campaign = await prisma.campaign.create({
    data: {
      userId: user.id,
      subject: "ReachInbox Test Email",
      body: "This is a test email from our ReachInbox scheduler.",
      startTime: new Date(),
      delayMs: 2000,
      hourlyLimit: 200,
      status: "ACTIVE",
    },
  });

  // 4. Create Email
  const email = await prisma.email.create({
    data: {
      campaignId: campaign.id,
      senderId: sender.id,

      recipient: "test-recipient@example.com",
      subject: campaign.subject,
      body: campaign.body,

      scheduledAt: new Date(Date.now() + 10_000),

      status: "SCHEDULED",

      sequenceNumber: 1,
    },
  });

  console.log("\nTest data created successfully:\n");

  console.log({
    userId: user.id,
    senderId: sender.id,
    campaignId: campaign.id,
    emailId: email.id,
    scheduledAt: email.scheduledAt,
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });