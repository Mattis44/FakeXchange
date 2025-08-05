import {WebSocket} from "ws";
import {handleOrderbookSubscribe} from "./handlers/orderbook_handler";
import {handleTradeSubscribe} from "./handlers/trades_handler";
import {handleCandleSubscribe} from "./handlers/candles_handler";

export async function handleMessage(ws: WebSocket, raw: string) {
    let message: any;

    try {
        message = JSON.parse(raw);
    } catch {
        return ws.send(jsonError("Invalid JSON"));
    }

    const {type, payload} = message;

    if (!type || typeof type !== "string") {
        return ws.send(jsonError("Missing or invalid 'type'"));
    }

    const [module, action] = type.split(".");

    if (!module || !action) {
        return ws.send(jsonError("Invalid type format (use module.action)"));
    }

    try {
        if (module === "orderbook" && action === "subscribe") {
            return await handleOrderbookSubscribe(ws, payload);
        }
        if (module === "trade" && action === "subscribe") {
            return await handleTradeSubscribe(ws, payload);
        }
        if (module === "candle" && action === "subscribe") {
            return await handleCandleSubscribe(ws, payload);
        }

        return ws.send(jsonError(`Unknown handler for ${type}`));
    } catch (err) {
        console.error(`Error handling ${type}:`, err);
        return ws.send(jsonError("Server error"));
    }
}

function jsonError(message: string) {
    return JSON.stringify({type: "error", message});
}
