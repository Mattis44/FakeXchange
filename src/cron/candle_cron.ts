import cron from "node-cron";
import {generateEmptyCandles} from "../utils/candle";

export function startCandleCron() {
    cron.schedule("* * * * *", async () => {
        try {
            await generateEmptyCandles();
        } catch (err) {
            console.error("Error :", err);
        }
    });

}
