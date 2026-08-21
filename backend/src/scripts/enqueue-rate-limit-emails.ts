import "dotenv/config";

import prisma from "../config/prisma.js";
import { emailQueue } from "../queue/email.queues.js";

async function main() {
  console.log("");
  console.log("========================================");
  console.log("     🚦 ENQUEUE RATE LIMIT TEST");
  console.log("========================================");

  const emails = await prisma.email.findMany({
    where: {
      recipient: {
        in: [
          "rate-limit-1@example.com",
          "rate-limit-2@example.com",
          "rate-limit-3@example.com",
        ],
      },
      status: "SCHEDULED",
    },
    orderBy: {
      sequenceNumber: "asc",
    },
  });

  if (emails.length !== 3) {
    throw new Error(
      `Expected 3 scheduled emails, found ${emails.length}.`,
    );
  }

  for (const email of emails) {
    await emailQueue.add(
      "send-email",
      {
        emailId: email.id,
      },
      {
        jobId: `rate-limit-test-${email.id}`,
        removeOnComplete: false,
        removeOnFail: false,
      },
    );

    console.log(`Enqueued: ${email.id}`);
  }

  console.log("");
  console.log(`✅ Enqueued ${emails.length} emails.`);
  console.log("");

  await prisma.$disconnect();
}

main().catch(async (error) => {
  console.error("");
  console.error("❌ Failed to enqueue emails");
  console.error(error);

  await prisma.$disconnect();

  process.exit(1);
});