import { WebSocket } from "ws";
import { prisma } from "../../prisma";
import { addSubscription } from "../ws_manager";

export async function handleCandleSubscribe(ws: WebSocket, payload: any) {
  const symbol = payload?.symbol;
  const resolution = payload?.resolution || "1m";

  if (!symbol) {
    return ws.send(
      JSON.stringify({
        type: "error",
        message: "Missing symbol in candle subscription",
      })
    );
  }

  const market = await prisma.market.findUnique({ where: { symbol } });

  if (!market) {
    return ws.send(
      JSON.stringify({
        type: "error",
        message: `Market ${symbol} not found`,
      })
    );
  }

  addSubscription(ws, {
    module: "candle",
    filter: {
      symbol: symbol.toUpperCase(),
      resolution,
    },
  });

  ws.send(
    JSON.stringify({
      type: "candle.subscribed",
      symbol,
      resolution,
    })
  );

}
