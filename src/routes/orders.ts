import express from "express";
import {prisma} from "../prisma";
import {broadcastToSubscribers} from "../ws/ws_manager";
import {createOrder} from "../repository/orders";

const router = express.Router();

router.post("/", async (req, res) => {
    const {userId, marketId, price, size, type, side} = req.body;
    if (!userId || !marketId || !price || !size || !type || !side) {
        return res.status(400).json({error: "All fields are required"});
    }

    try {
        const order = await createOrder({
            userId,
            marketId,
            price,
            size,
            type,
            side,
        });
        return res.status(201).json(order);
    } catch (error) {
        return res.status(500).json({error: "Failed to create order"});
    }
});

export default router;
