import WebSocket from "ws";
import blessed from "blessed";

const SYMBOL = "TESTUSD";
const ws = new WebSocket("ws://localhost:3000");

let bids = [];
let asks = [];
let lastPrice = null;

const screen = blessed.screen({
  smartCSR: true,
  title: `Orderbook - ${SYMBOL}`,
});

const asksBox = blessed.box({
  top: 0,
  left: 0,
  width: "100%",
  height: "45%",
  label: "ASKS (SELL)",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "red",
    border: { fg: "red" },
  },
  scrollable: true,
});

const bidsBox = blessed.box({
  top: "55%",
  left: 0,
  width: "100%",
  height: "45%",
  label: "BIDS (BUY)",
  tags: true,
  border: { type: "line" },
  style: {
    fg: "green",
    border: { fg: "green" },
  },
  scrollable: true,
});

const priceBox = blessed.box({
  top: "50%",
  left: "center",
  width: "shrink",
  height: 1,
  content: "",
  tags: true,
  style: {
    fg: "white",
    bold: true,
  },
});

screen.append(asksBox);
screen.append(bidsBox);
screen.append(priceBox);

screen.key(["escape", "q", "C-c"], () => process.exit(0));

ws.on("open", () => {
  ws.send(
    JSON.stringify({
      type: "orderbook.subscribe",
      payload: { symbol: SYMBOL },
    })
  );
   ws.send(
    JSON.stringify({
      type: "trade.subscribe",
      payload: { symbol: SYMBOL },
    })
  );
});

ws.on("message", (data) => {
  const msg = JSON.parse(data.toString());

  if (msg.type === "orderbook.delta") {
    const { order, action } = msg;
    const list = order.side === "buy" ? bids : asks;

    if (action === "add") {
      list.push(order);
    }

    if (action === "remove") {
      const index = list.findIndex((o) => o.id === order.id);
      if (index !== -1) {
        list.splice(index, 1);
      }
    }

    if (action === "update") {
      const index = list.findIndex((o) => o.id === order.id);
      if (index !== -1) {
        list[index] = order;
      }
    }

    bids.sort((a, b) => b.price - a.price);
    asks.sort((a, b) => a.price - b.price);

    render();
  }

  if (msg.type === "trade.executed") {
    lastPrice = msg.price ?? msg?.trade?.price ?? null;
    render();
  }
});

function render() {
  const maxLines = 20;

  const aggregatedAsks = aggregateOrders(asks).sort((a, b) => a.price - b.price);
  const aggregatedBids = aggregateOrders(bids).sort((a, b) => b.price - a.price);

  const askLines = aggregatedAsks
    .slice(0, maxLines)
    .reverse()
    .map((o) => `{red-fg}${o.price.toFixed(2)} x ${o.size.toFixed(2)}{/red-fg}`);

  const bidLines = aggregatedBids
    .slice(0, maxLines)
    .map((o) => `{green-fg}${o.price.toFixed(2)} x ${o.size.toFixed(2)}{/green-fg}`);

  asksBox.setContent(askLines.join("\n"));
  bidsBox.setContent(bidLines.join("\n"));

  priceBox.setContent(
    lastPrice !== null
      ? `{bold}{white-fg}Last Price: ${lastPrice.toFixed(2)}{/white-fg}{/bold}`
      : `{gray-fg}Waiting for trade...{/gray-fg}`
  );

  screen.render();
}

function aggregateOrders(orders) {
  const map = new Map();

  for (const order of orders) {
    const key = order.price.toFixed(2);
    const total = map.get(key) || 0;
    map.set(key, total + order.remaining);
  }

  return Array.from(map.entries()).map(([price, size]) => ({
    price: parseFloat(price),
    size,
  }));
}
