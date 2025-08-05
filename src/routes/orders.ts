import express from "express";
import {createOrder} from "../repository/orders";

const router = express.Router();

router.post("/", async (req, res) => {
    const {userId, marketId, price, size, type, side} = req.body;
    if (!userId || !marketId || !price || !size || !type || !side) {
        return res.status(400).json({error: "All fields are required"});
    }

    if (price <= 0 || size <= 0) {
        return res.status(400).json({error: "Price and size must be greater than zero"});
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
