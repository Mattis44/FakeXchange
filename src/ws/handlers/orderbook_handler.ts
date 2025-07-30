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

    const orders = await prisma.order.findMany({
        where: {marketId: market.id, OR: [{status: "open"}, {status: "partial"}]},
    });

    const bids = orders
        .filter((o) => o.side === "buy")
        .sort((a, b) => b.price - a.price);
    const asks = orders
        .filter((o) => o.side === "sell")
        .sort((a, b) => a.price - b.price);

    ws.send(JSON.stringify({type: "orderbook.init", symbol, bids, asks}));
}
