import "dotenv/config";

import redisConnection from "../config/redis.js";

async function main() {
  console.log("");
  console.log("========================================");
  console.log("    🧹 CLEAR RATE LIMIT TEST DATA");
  console.log("========================================");

  const keys = await redisConnection.keys(
    "email:rate-limit:*",
  );

  if (keys.length === 0) {
    console.log("");
    console.log("No rate-limit keys found.");
  } else {
    await redisConnection.del(...keys);

    console.log("");
    console.log(`Deleted ${keys.length} rate-limit key(s).`);
  }

  console.log("");
  console.log("========================================");

  await redisConnection.quit();
}

main().catch(async (error) => {
  console.error(error);

  await redisConnection.quit();

  process.exit(1);
});