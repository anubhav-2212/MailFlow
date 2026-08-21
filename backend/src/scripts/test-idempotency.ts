import "dotenv/config";

import { Queue } from "bullmq";

import redisConnection from "../config/redis.js";
import { EMAIL_QUEUE_NAME } from "../queue/email.queues.js";
const EMAIL_ID =
  "290ae237-a66a-45b9-a7f4-657b13fbf938";

const queue = new Queue(EMAIL_QUEUE_NAME, {
  connection: redisConnection,
});

async function main() {
  console.log("");
  console.log("========================================");
  console.log("        🔐 IDEMPOTENCY TEST");
  console.log("========================================");

  console.log("");
  console.log(`Email ID : ${EMAIL_ID}`);

  console.log("");
  console.log("Creating TWO jobs for SAME email...");
  console.log("");

  const job1 = await queue.add(
    "send-email",
    {
      emailId: EMAIL_ID,
    },
    {
      jobId: `idempotency-test-1-${EMAIL_ID}`,
      removeOnComplete: false,
      removeOnFail: false,
    },
  );

  const job2 = await queue.add(
    "send-email",
    {
      emailId: EMAIL_ID,
    },
    {
      jobId: `idempotency-test-2-${EMAIL_ID}`,
      removeOnComplete: false,
      removeOnFail: false,
    },
  );

  console.log("----------------------------------------");

  console.log(`Job 1 : ${job1.id}`);
  console.log(`Job 2 : ${job2.id}`);

  console.log("----------------------------------------");

  console.log("");
  console.log("✅ TWO jobs created.");
  console.log("");
  console.log("Both jobs point to the SAME email.");
  console.log("");
  console.log("Now start the worker:");
  console.log("");
  console.log("npx tsx src/workers/email.worker.ts");
  console.log("");

  await queue.close();
  await redisConnection.quit();
}

main().catch(async (error) => {
  console.error("");
  console.error("❌ Test failed");
  console.error(error);

  await queue.close();
  await redisConnection.quit();

  process.exit(1);
});