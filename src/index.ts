import express from "express";
import http from "http";

import userRoutes from "./routes/users";
import orderRoutes from "./routes/orders";
import orderbookRoutes from "./routes/orderbook";
import {WebSocket, WebSocketServer} from "ws";
import {handleMessage} from "./ws/ws_router";
import {removeSubscriptions} from "./ws/ws_manager";

const app = express();
const port = 3000;

const server = http.createServer(app);

app.use(express.json());

const wss = new WebSocketServer({server});


app.use("/users", userRoutes);

app.use("/orders", orderRoutes);

app.use("/orderbook", orderbookRoutes);

wss.on("connection", (ws) => {
    console.log("New WebSocket connection");
    ws.on("message", (data) => handleMessage(ws, data.toString()));
    ws.on("close", () => {
        removeSubscriptions(ws);
        console.log("WebSocket connection closed");
    });
});

server.listen(port, () => {
    console.log(`🚀 Server running on http://localhost:${port}`);
});
