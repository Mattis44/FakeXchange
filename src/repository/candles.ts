import { prisma } from "../prisma";
import { broadcastToSubscribers } from "../ws/ws_manager";

export async function updateCandlesForTrades(trades: {
    price: number;
    size: number;
    symbol: string;
    timestamp: number;
    candleTimestamp: number;
}[]) {
    const updatedCandles: any[] = [];

    for (const trade of trades) {
        const candle = await prisma.candle.findFirst({
            where: {
                market: {
                    symbol: trade.symbol,
                },
                timestamp: trade.candleTimestamp,
                resolution: "1m",
            },
        });

        if (!candle) {
            console.warn("No candle found for trade timestamp, skipping...");
            continue;
        }

        const updated = await prisma.candle.update({
            where: { id: candle.id },
            data: {
                high: Math.max(candle.high, trade.price),
                low: Math.min(candle.low, trade.price),
                close: trade.price,
                volume: candle.volume + trade.size,
            },
        });

        updatedCandles.push({
            timestamp: Number(updated.timestamp),
            open: updated.open,
            high: updated.high,
            low: updated.low,
            close: updated.close,
            volume: updated.volume,
            symbol: trade.symbol,
            resolution: "1m",
        });
    }

    if (updatedCandles.length > 0) {
        broadcastToSubscribers(
            "candle",
            { symbol: updatedCandles[0].symbol, resolution: "1m" },
            {
                type: "candle.update.batch",
                candles: updatedCandles,
            }
        );
    }
}
