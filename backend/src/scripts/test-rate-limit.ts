import "dotenv/config";

import prisma from "../config/prisma.js";
import redisConnection from "../config/redis.js";
import { consumeHourlyEmailSlot } from "../services/email/email-rate-limit.service.js";

async function main() {
  console.log("");
  console.log("========================================");
  console.log("       🚦 RATE LIMIT TEST");
  console.log("========================================");

  // ----------------------------------------
  // Find two different senders
  // ----------------------------------------

  const senders = await prisma.sender.findMany({
    take: 2,
  });

  if (senders.length < 2) {
    throw new Error(
      "Need at least 2 senders in the database.",
    );
  }

  const senderA = senders[0];
  const senderB = senders[1];

  // Extra TypeScript safety check
  if (!senderA || !senderB) {
    throw new Error(
      "Need at least 2 senders in the database.",
    );
  }

  console.log("");
  console.log(`Sender A : ${senderA.id}`);
  console.log(`Sender B : ${senderB.id}`);

  // ----------------------------------------
  // Test Sender A
  // ----------------------------------------

  console.log("");
  console.log("Testing Sender A...");
  console.log("");

  for (let i = 1; i <= 3; i++) {
    const result = await consumeHourlyEmailSlot(
      senderA.id,
    );

    console.log(
      `Sender A | Request ${i} | allowed=${result.allowed} | count=${result.count} | limit=${result.limit}`,
    );
  }

  // ----------------------------------------
  // Test Sender B
  // ----------------------------------------

  console.log("");
  console.log("Testing Sender B...");
  console.log("");

  for (let i = 1; i <= 3; i++) {
    const result = await consumeHourlyEmailSlot(
      senderB.id,
    );

    console.log(
      `Sender B | Request ${i} | allowed=${result.allowed} | count=${result.count} | limit=${result.limit}`,
    );
  }

  console.log("");
  console.log("========================================");
  console.log("       ✅ RATE LIMIT TEST COMPLETE");
  console.log("========================================");
  console.log("");

  await prisma.$disconnect();
  await redisConnection.quit();
}

main().catch(async (error) => {
  console.error("");
  console.error("❌ Rate limit test failed");
  console.error(error);

  await prisma.$disconnect();
  await redisConnection.quit();

  process.exit(1);
});