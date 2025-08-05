type Candle = {
    timestamp: bigint;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
};

function resolutionToMs(resolution: string): number {
    const map: Record<string, number> = {
        "1m": 60_000,
        "5m": 300_000,
        "15m": 900_000,
        "1h": 3_600_000,
        "1d": 86_400_000,
    };
    return map[resolution];
}

export default function groupCandles(candles: Candle[], resolution: string) {
    const interval = resolutionToMs(resolution);

    const grouped: Record<number, Candle[]> = {};

    for (const candle of candles) {
        const bucketTime = Math.floor(Number(candle.timestamp) / interval) * interval;

        if (!grouped[bucketTime]) grouped[bucketTime] = [];
        grouped[bucketTime].push(candle);
    }

    const result = Object.entries(grouped).map(([bucket, group]) => {
        const sorted = group.sort((a, b) => Number(a.timestamp) - Number(b.timestamp));
        return {
            timestamp: Number(bucket),
            open: sorted[0].open,
            close: sorted[sorted.length - 1].close,
            high: Math.max(...sorted.map((c) => c.high)),
            low: Math.min(...sorted.map((c) => c.low)),
            volume: group.reduce((acc, c) => acc + c.volume, 0),
        };
    });

    return result;
}
