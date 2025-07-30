import {WebSocket} from "ws";
import {prisma} from "../../prisma";
import {addSubscription} from "../ws_manager";

export async function handleTradeSubscribe(ws: WebSocket, payload: any) {
    const symbol = payload?.symbol;

    if (!symbol) {
        return ws.send(
            JSON.stringify({
                type: "error",
                message: "Missing symbol in trade subscription",
            })
        );
    }

    const market = await prisma.market.findUnique({where: {symbol}});

    if (!market) {
        return ws.send(
            JSON.stringify({
                type: "error",
                message: `Market ${symbol} not found`,
            })
        );
    }

    addSubscription(ws, {
        module: "trade",
        filter: {symbol: symbol.toUpperCase()},
    });

    ws.send(
        JSON.stringify({
            type: "trade.subscribed",
            symbol,
        })
    );
}
