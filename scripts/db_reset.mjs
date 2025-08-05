import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function resetAll() {
  console.log("Resetting database...");

  await prisma.trade.deleteMany();
  await prisma.order.deleteMany();
  await prisma.candle.deleteMany();

  console.log("Database reset complete.");

  await prisma.$disconnect();
}

resetAll().catch((err) => {
  console.error("Failed to reset database:", err);
  prisma.$disconnect();
});
