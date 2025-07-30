import { WebSocket } from "ws";

export type Subscription = {
  module: string;
  filter: Record<string, any>;
};

const clients: Map<WebSocket, Subscription[]> = new Map();

export function addSubscription(ws: WebSocket, sub: Subscription) {
  const existing = clients.get(ws) || [];
  clients.set(ws, [...existing, sub]);
}

export function removeSubscriptions(ws: WebSocket) {
  clients.delete(ws);
}

export function getSubscriptions(ws: WebSocket): Subscription[] {
  return clients.get(ws) || [];
}

export function broadcastToSubscribers(
  module: string,
  filter: Record<string, any>,
  data: any
) {
  for (const [ws, subs] of clients.entries()) {
    for (const sub of subs) {
      if (sub.module === module && matchFilter(sub.filter, filter)) {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify(data));
        }
        break;
      }
    }
  }
}

function matchFilter(a: Record<string, any>, b: Record<string, any>): boolean {
  for (const key in a) {
    if (a[key] !== b[key]) return false;
  }
  return true;
}
