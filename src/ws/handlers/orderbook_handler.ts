import {WebSocket} from "ws";
import {prisma} from "../../prisma";
import {addSubscription} from "../ws_manager";

export async function handleOrderbookSubscribe(ws: WebSocket, payload: any) {
    const symbol = payload?.symbol;

    if (!symbol) {
        return ws.send(
            JSON.stringify({type: "error", message: "Missing symbol"})
        );
    }

    const market = await prisma.market.findUnique({where: {symbol}});
    if (!market) {
        return ws.send(
            JSON.stringify({type: "error", message: "Market not found"})
        );
    }

    addSubscription(ws, {
        module: "orderbook",
        filter: {symbol: symbol.toUpperCase()},
    });
}
