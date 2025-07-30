import axios from "axios";

const API_URL = "http://localhost:3000/orders";
const MARKET_ID = "fae7bc8d-244b-41f3-b64e-aa6cff000bc3";
const USER_ID = "2479a106-a327-4722-b15e-748f095f9282";

let lastPrice = 100;
let tradeCount = 0;

function randomSize() {
    return parseFloat((Math.random() * 2 + 0.1).toFixed(2));
}

function sleep(ms) {
    return new Promise((res) => setTimeout(res, ms));
}

async function createTradePair() {
    tradeCount++;

    const bigMoveTrigger = Math.floor(Math.random() * 5) + 10;
    if (tradeCount % bigMoveTrigger === 0) {
        const direction = Math.random() < 0.5 ? 1 : 1;
        const factor = 1 + direction * 1; // 30% move
        lastPrice = parseFloat((lastPrice * factor).toFixed(2));
        console.log(`BIG MOVE: ${direction > 0 ? "↑" : "↓"} 10% → ${lastPrice}`);
    }

    const size = randomSize();

    const delta = parseFloat((Math.random() * 0.5).toFixed(2));

    const direction = Math.random() > 0.5 ? 1 : 1;

    const midPrice = parseFloat((lastPrice + direction * delta).toFixed(2));

    const spread = parseFloat((Math.random() * 0.1 + 0.01).toFixed(2));
    const sellPrice = parseFloat((midPrice + spread / 2).toFixed(2));
    const buyPrice = parseFloat((midPrice - spread / 2).toFixed(2));

    lastPrice = midPrice;

    const sellOrder = {
        userId: USER_ID,
        marketId: MARKET_ID,
        side: "sell",
        type: "limit",
        price: sellPrice,
        size,
    };

    const buyOrder = {
        userId: USER_ID,
        marketId: MARKET_ID,
        side: "buy",
        type: "limit",
        price: buyPrice,
        size,
    };

    try {
        await axios.post(API_URL, sellOrder);
        await axios.post(API_URL, buyOrder);
        console.log(`Trade #${tradeCount}: Buy ${buyPrice} / Sell ${sellPrice}`);
    } catch (err) {
        console.error("Failed to create trade:", err.message);
    }

    const nextDelay = Math.random() * 10 + 5;
    await sleep(nextDelay);
    createTradePair();
}

createTradePair();
