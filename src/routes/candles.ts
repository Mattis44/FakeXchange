import express from "express";
import {prisma} from "../prisma";
import groupCandles from "../utils/market";

const router = express.Router();

type Resolution = "1m" | "5m" | "15m" | "1h" | "1d";

router.post("/", async (req, res) => {
    const {
        symbol,
        startTime,
        endTime,
        resolution,
    }: {
        symbol: string;
        startTime: number;
        endTime: number;
        resolution: Resolution;
    } = req.body;

    if (!symbol || !endTime || !startTime || !resolution) {
        return res.status(400).json({error: "All fields are required"});
    }
    if (Number.isNaN(startTime) || Number.isNaN(endTime)) {
        return res.status(400).json({error: "Invalid startTime or endTime"});
    }
    if (startTime >= endTime) {
        return res
            .status(400)
            .json({error: "startTime must be less than endTime"});
    }
    if (!["1m", "5m", "15m", "1h", "1d"].includes(resolution)) {
        return res.status(400).json({error: "Invalid resolution"});
    }

    try {
        const candles = await prisma.candle.findMany({
            where: {
                market: {
                    symbol: symbol.toUpperCase(),
                },
                timestamp: {
                    gte: startTime,
                    lte: endTime,
                },
                resolution: "1m",
            },
            include: {
                market: true,
            },
            orderBy: {timestamp: "asc"},
        });

        const grouped = groupCandles(candles, resolution);

        res.json(grouped);
    } catch (error) {
        console.error("Error fetching candles:", error);
        res.status(500).json({error: "Internal server error"});
    }
});

export default router;
