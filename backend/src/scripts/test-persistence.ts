import "dotenv/config";

import prisma from "../config/prisma.js";
import { scheduleEmail } from "../queue/email.queues.js";

async function main() {
  // Find one email that has not been sent yet
  const email = await prisma.email.findFirst({
    where: {
      status: "SCHEDULED",
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  if (!email) {
    throw new Error("No SCHEDULED email found.");
  }

  // Schedule it 2 minutes from now
  const scheduledAt = new Date(
    Date.now() + 2 * 60 * 1000,
  );

  // Add the email to BullMQ
  const job = await scheduleEmail(
    email.id,
    scheduledAt,
  );

  console.log("\n========================================");
  console.log("       📬 PERSISTENCE TEST");
  console.log("========================================");
  console.log(`Email ID     : ${email.id}`);
  console.log(`Job ID       : ${job.id}`);
  console.log(
    `Scheduled At : ${scheduledAt.toISOString()}`,
  );
  console.log(
    `Delay        : ${job.opts.delay} ms`,
  );
  console.log("========================================\n");
}

main()
  .catch((error) => {
    console.error("❌ Persistence test failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });