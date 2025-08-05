import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function addMarket() {
    console.log("Adding market...");
    const market = await prisma.market.create({
        data: {
            symbol: "TESTUSD",
            base: "TEST",
            quote: "USD",
        }
    });
    console.log("Market added:", market);
}

addMarket()
    .catch((error) => {
        console.error("Error adding market:", error);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });