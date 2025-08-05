import {prisma} from "../prisma";
import {match_order} from "../services/matching_engine";
import {broadcastToSubscribers} from "../ws/ws_manager";
import { updateCandleForTrade } from "./candles";

interface createOrderParams {
    userId: string;
    marketId: string;
    side: "buy" | "sell";
    type: "limit" | "market";
    price: number;
    size: number;
}

export const createOrder = async (params: createOrderParams) => {
    try {
        const {userId, marketId, side, type, price, size} = params;

        const order = await prisma.order.create({
            data: {
                userId,
                marketId,
                side,
                type,
                price,
                size,
                remaining: size,
                status: "open",
            },
        });
        if (!order) {
            throw new Error("Failed to create order");
        }
        const market = await prisma.market.findUnique({
            where: {id: marketId},
        });
        if (!market) {
            throw new Error("Market not found");
        }
        const {trades, deltas} = await match_order(order);
        for (const trade of trades) {
            broadcastToSubscribers(
                "trade",
                {symbol: trade.symbol},
                {
                    type: "trade.executed",
                    ...trade,
                }
            );
            await updateCandleForTrade(trade);
        }

        for (const delta of deltas) {
            broadcastToSubscribers(
                "orderbook",
                {symbol: market.symbol},
                {
                    type: "orderbook.delta",
                    symbol: market.symbol,
                    action: delta.action,
                    order: {
                        id: delta.order.id,
                        userId: delta.order.userId,
                        side: delta.order.side,
                        type: delta.order.type,
                        price: delta.order.price,
                        size: delta.order.size,
                        remaining: delta.order.remaining,
                    },
                }
            );
        }

        if (!trades?.length && type === "limit") {
            broadcastToSubscribers(
                "orderbook",
                {symbol: market.symbol},
                {
                    type: "orderbook.delta",
                    symbol: market.symbol,
                    action: "add",
                    order: {
                        id: order.id,
                        userId: order.userId,
                        side: order.side,
                        type: order.type,
                        price: order.price,
                        size: order.size,
                        remaining: order.remaining,
                    },
                }
            );
        }
        return order;
    } catch (error) {
        console.error("Error in createOrder:", error);
        throw error;
    }
};
