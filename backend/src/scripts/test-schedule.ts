import "dotenv/config";

import prisma from "../config/prisma.js";
import { scheduleEmail } from "../queue/email.queues.js";

async function main() {
  const emails = await prisma.email.findMany({
    where: {
      status: "SCHEDULED",
    },
    orderBy: {
      createdAt: "desc",
    },
    take: 6,
  });

  if (emails.length < 6) {
    throw new Error(
      `Expected 6 scheduled emails, but found ${emails.length}.`,
    );
  }

  console.log("\nScheduling 6 emails...\n");

  for (const email of emails) {
    const job = await scheduleEmail(
      email.id,
      new Date(),
    );

    console.log({
      jobId: job.id,
      emailId: email.id,
      delay: job.opts.delay,
    });
  }

  console.log("\nAll 6 jobs scheduled successfully.");
}

main()
  .catch((error) => {
    console.error("Failed to schedule emails:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });