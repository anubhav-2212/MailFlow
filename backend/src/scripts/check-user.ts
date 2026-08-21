import "dotenv/config";

import prisma from "../config/prisma.js";

async function main() {
  const user = await prisma.user.findFirst();

  if (!user) {
    console.log("❌ No user found.");
    return;
  }

  console.log("\n================================");
  console.log("         USER FOUND");
  console.log("================================");
  console.log(`ID    : ${user.id}`);
  console.log(`Name  : ${user.name}`);
  console.log(`Email : ${user.email}`);
  console.log("================================\n");
}

main()
  .catch((error) => {
    console.error("❌ Error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });