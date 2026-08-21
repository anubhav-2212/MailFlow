import "dotenv/config";

import { emailQueue } from "../queue/email.queues.js";

async function main() {
  const jobs = await emailQueue.getJobs([
    "delayed",
    "waiting",
    "active",
    "completed",
    "failed",
  ]);

  console.log("\n========================================");
  console.log("        📬 EMAIL QUEUE STATUS");
  console.log("========================================\n");

  if (jobs.length === 0) {
    console.log("No jobs found in the queue.\n");
    return;
  }

  for (const job of jobs) {
    const state = await job.getState();

    console.log("----------------------------------------");
    console.log(`Job ID       : ${job.id}`);
    console.log(`Email ID     : ${job.data.emailId}`);
    console.log(`State        : ${state}`);
    console.log(`Delay        : ${job.opts.delay ?? 0} ms`);

    if (state === "delayed") {
      const delay = job.opts.delay ?? 0;

      const remainingMs = Math.max(
  0,
  (job.timestamp ?? Date.now()) +
    delay -
    Date.now(),
);

console.log(
  `Runs in      : ${(remainingMs / 1000).toFixed(1)} seconds`,
);
    }

    console.log("----------------------------------------\n");
  }

  console.log("========================================\n");
}

main()
  .catch((error) => {
    console.error("\n❌ Failed to check queue:", error);
    process.exit(1);
  })
  .finally(async () => {
    await emailQueue.close();
  });