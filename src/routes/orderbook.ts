import express from "express";
import {prisma} from "../prisma";

const router = express.Router();

router.get("/:symbol", async (req, res) => {
    const {symbol} = req.params;
    if (!symbol) {
        return res.status(400).json({error: "Symbol is required"});
    }
    try {
        const market = await prisma.market.findUnique({
            where: {symbol},
        });
        if (!market) {
            return res.status(404).json({error: "Market not found"});
        }
        const orders = await prisma.order.findMany({
            where: {
                marketId: market.id,
                OR: [{status: "open"}, {status: "partial"}],
            },
        });
        const bids = orders
            .filter((o) => o.side === "buy")
            .sort((a, b) => b.price - a.price);

        const asks = orders
            .filter((o) => o.side === "sell")
            .sort((a, b) => a.price - b.price);

        res.json({
            symbol: market.symbol,
            base: market.base,
            quote: market.quote,
            bids,
            asks,
            lastPrice: market.lastPrice,
        });
    } catch (error) {
        return res.status(500).json({error: "Failed to retrieve orderbook"});
    }
});

export default router;
