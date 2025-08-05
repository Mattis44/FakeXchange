import axios from "axios";

const API_URL = "http://localhost:3000/orders";
const MARKET_ID = "f5f94be9-8426-46d0-9a30-271092634a61";
const USER_ID = "f7eed2d2-1917-46ef-8c5c-55b8b830c491";

let lastPrice = 100;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomSize() {
    return parseFloat((Math.random() * 3 + 0.1).toFixed(2));
}

function randomPriceAround(base, variance = 0.3) {
    const delta = (Math.random() * variance) * (Math.random() > 0.5 ? 1 : -1);
    return parseFloat((base + delta).toFixed(2));
}

async function placeLimitOrder(side, price, size) {
    const order = {
        userId: USER_ID,
        marketId: MARKET_ID,
        side,
        type: "limit",
        price,
        size,
    };

    try {
        await axios.post(API_URL, order);
        console.log(`📥 ${side.toUpperCase()} @ ${price} [${size}]`);
    } catch (err) {
        console.error(`Failed to place ${side} order:`, err.message);
    }
}

async function runSimulation() {
    while (true) {
        const buyOrders = [];
        const sellOrders = [];

        for (let i = 0; i < 5; i++) {
            const size = randomSize();
            const buyPrice = randomPriceAround(lastPrice - 0.2, 0.1);
            const sellPrice = randomPriceAround(lastPrice + 0.2, 0.1);

            buyOrders.push(placeLimitOrder("buy", buyPrice, size));
            sellOrders.push(placeLimitOrder("sell", sellPrice, size));
        }

        await Promise.all([...buyOrders, ...sellOrders]);

        if (Math.random() < 0.6) {
            const tradePrice = randomPriceAround(lastPrice, 0.2);
            const size = randomSize();
            await placeLimitOrder("buy", tradePrice, size);
            await placeLimitOrder("sell", tradePrice, size);
            lastPrice = tradePrice;
            console.log(`💥 Executed trade at ${tradePrice}`);
        }

        const wait = Math.floor(Math.random() * 5) + 1; // wait between 1 and 5 seconds
        console.log(`⏱ Waiting ${wait}s before next batch...`);
        await sleep(wait * 1000);
    }
}

runSimulation();
