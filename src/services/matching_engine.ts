import {Order} from "@prisma/client";
import {prisma} from "../prisma";

export async function match_order(order: Order) {
    const executed_trades: {
        price: number;
        size: number;
        symbol: string;
        timestamp: number;
        candleTimestamp: number;
    }[] = [];

    const deltas : {
        action: "add" | "remove" | "update";
        order: Order;
    }[] = [];

    await prisma.$transaction(async (tx) => {
        const is_buy = order.side === "buy";
        const opposite_side = is_buy ? "sell" : "buy";
        let remaining = order.remaining;

        const current_order = await tx.order.findUnique({
            where: {id: order.id},
        });

        if (!current_order) {
            throw new Error("Order not found");
        }

        let orders: Order[] = [];

        if (order.type === "market") {
            orders = await prisma.order.findMany({
                where: {
                    marketId: order.marketId,
                    side: is_buy ? "sell" : "buy",
                    OR: [
                        {status: "open"},
                        {status: "partial"},
                    ],
                },
                orderBy: {
                    price: is_buy ? "asc" : "desc",
                },
            });
        } else {
            orders = await prisma.order.findMany({
                where: {
                    marketId: order.marketId,
                    side: opposite_side,
                    OR: [
                        {status: "open"},
                        {status: "partial"},
                    ],
                    price: {
                        [is_buy ? "lte" : "gte"]: order.price,
                    },
                },
                orderBy: {
                    price: is_buy ? "asc" : "desc",
                },
            });
        }

        let last_traded_price: number | null = null;

        for (const counter of orders) {
            if (remaining <= 0) break;

            const trade_size = Math.min(remaining, counter.remaining);
            const trade_price = counter.price;
            remaining -= trade_size;
            last_traded_price = trade_price;

            await tx.trade.create({
                data: {
                    marketId: order.marketId,
                    price: trade_price,
                    size: trade_size,
                    buyOrderId: is_buy ? order.id : counter.id,
                    sellOrderId: is_buy ? counter.id : order.id,
                    takerOrderId: order.id,
                    makerOrderId: counter.id,
                },
            });

            const new_remaining = counter.remaining - trade_size;
            const updated_counter = await tx.order.update({
                where: {id: counter.id},
                data: {
                    remaining: new_remaining,
                    status: new_remaining <= 0 ? "filled" : "partial",
                    role: "MAKER",
                },
            });

            deltas.push({
                action: new_remaining <= 0 ? "remove" : "update",
                order: updated_counter,
            });

            const updated_current = await tx.order.update({
                where: {id: order.id},
                data: {
                    remaining: remaining,
                    status: remaining <= 0 ? "filled" : "partial",
                    role: remaining <= 0 ? "MAKER" : "TAKER",
                },
            });

            deltas.push({
                action: remaining <= 0 ? "remove" : "add",
                order: updated_current,
            });

            if (last_traded_price !== null) {
                await tx.market.update({
                    where: {id: order.marketId},
                    data: {
                        lastPrice: last_traded_price,
                    },
                });
            }

            const symbol = (
                await tx.market.findUnique({
                    where: {id: order.marketId},
                })
            )?.symbol;

            if (!symbol) {
                throw new Error("Market not found");
            }

            const timestamp = Date.now();
            const candleTimestamp = timestamp - (timestamp % 60_000);
            executed_trades.push({
                price: trade_price,
                size: trade_size,
                symbol: symbol.toUpperCase(),
                timestamp,
                candleTimestamp,
            });
        }
    });

   return { trades: executed_trades, deltas }
}
