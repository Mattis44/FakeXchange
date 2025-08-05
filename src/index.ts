import express from "express";
import http from "http";
import cors from "cors";

import userRoutes from "./routes/users";
import orderRoutes from "./routes/orders";
import orderbookRoutes from "./routes/orderbook";
import candleRoutes from "./routes/candles";
import {WebSocketServer} from "ws";
import {handleMessage} from "./ws/ws_router";
import {removeSubscriptions} from "./ws/ws_manager";
import { startCandleCron } from "./cron/candle_cron";

const app = express();
const port = 3000;

const server = http.createServer(app);

app.use(cors());
app.use(express.json());

const wss = new WebSocketServer({server});

app.use("/users", userRoutes);

app.use("/orders", orderRoutes);

app.use("/orderbook", orderbookRoutes);

app.use("/candles", candleRoutes);

wss.on("connection", (ws) => {
    console.log("New WebSocket connection");
    ws.on("message", (data) => handleMessage(ws, data.toString()));
    ws.on("close", () => {
        removeSubscriptions(ws);
        console.log("WebSocket connection closed");
    });
});

server.listen(port, () => {
    startCandleCron();
    console.log(`🚀 Server running on http://localhost:${port}`);
});
