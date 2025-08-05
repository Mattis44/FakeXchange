import { prisma } from "../prisma";
import { broadcastToSubscribers } from "../ws/ws_manager";

export async function generateEmptyCandles() {
    const now = Date.now();
    const alignedTimestamp = now - (now % 60_000);

    const markets = await prisma.market.findMany();

    for (const market of markets) {
        const existing = await prisma.candle.findFirst({
            where: {
                marketId: market.id,
                resolution: "1m",
                timestamp: alignedTimestamp,
            },
        });

        if (existing) {
            console.log(`Candle already exists for ${market.symbol}`);
            continue;
        }

        const candle = await prisma.candle.create({
            data: {
                marketId: market.id,
                resolution: "1m",
                timestamp: alignedTimestamp,
                open: market.lastPrice,
                high: market.lastPrice,
                low: market.lastPrice,
                close: market.lastPrice,
                volume: 0,
            },
        });

        broadcastToSubscribers(
            "candle",
            { symbol: market.symbol.toUpperCase(), resolution: "1m" },
            {
                type: "candle.add",
                data: {
                    timestamp: Number(candle.timestamp),
                    open: candle.open,
                    high: candle.high,
                    low: candle.low,
                    close: candle.close,
                    volume: candle.volume,
                },
            }
        );
    }
}
