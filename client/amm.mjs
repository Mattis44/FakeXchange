import axios from "axios";

const API_URL = "http://localhost:3000/orders";
const MARKET_ID = "f5f94be9-8426-46d0-9a30-271092634a61";
const USER_ID = "f7eed2d2-1917-46ef-8c5c-55b8b830c491";

let lastPrice = 100;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomSize() {
    return parseFloat((Math.random() * 2 + 0.1).toFixed(2)); // moins gros volumes
}

function randomPriceAround(base, variance = 0.2) {
    const delta = (Math.random() * variance) * (Math.random() > 0.5 ? 1 : -1);
    return parseFloat((base + delta).toFixed(2));
}

async function placeOrder(side, type, price, size) {
    const order = { userId: USER_ID, marketId: MARKET_ID, side, type, price, size };
    try {
        await axios.post(API_URL, order);
        console.log(`📥 ${side.toUpperCase()} ${type} @ ${price} [${size}]`);
    } catch (err) {
        console.error(`Failed to place ${side} order:`, err.message);
    }
}

async function runSimulation() {
    while (true) {
        // 1. Quelques ordres limit autour du prix
        for (let i = 0; i < 2; i++) { // moins d'ordres
            const size = randomSize();
            await placeOrder("buy", "limit", randomPriceAround(lastPrice - 0.1, 0.05), size);
            await placeOrder("sell", "limit", randomPriceAround(lastPrice + 0.1, 0.05), size);
        }

        // 2. Forcer une exécution à chaque boucle
        const tradePrice = randomPriceAround(lastPrice, 0.05);
        const size = randomSize();
        await placeOrder("buy", "limit", tradePrice, size);
        await placeOrder("sell", "limit", tradePrice, size);
        lastPrice = tradePrice;
        console.log(`💥 Executed trade at ${tradePrice}`);

        // 3. Pause
        const wait = Math.floor(Math.random() * 3) + 1; 
        console.log(`⏱ Waiting ${wait}s before next batch...`);
        await sleep(wait * 1000);
    }
}

runSimulation();
