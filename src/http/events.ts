import type { ServerResponse } from 'node:http';
import type { DeskEvent } from '../core/watch.js';

export interface EventHub { add(res: ServerResponse): void; broadcast(event: DeskEvent): void; closeAll(): void; size(): number; }

export function createEventHub(heartbeatMs = 25_000): EventHub {
  const clients = new Set<ServerResponse>();
  const heartbeat = setInterval(() => { for (const client of clients) client.write(': ping\n\n'); }, heartbeatMs);
  heartbeat.unref();
  return {
    add(res) { res.writeHead(200, { 'content-type': 'text/event-stream; charset=utf-8', 'cache-control': 'no-store', connection: 'keep-alive' }); res.write(': connected\n\n'); clients.add(res); res.on('close', () => clients.delete(res)); },
    broadcast(event) { const frame = `event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`; for (const client of clients) client.write(frame); },
    closeAll() { clearInterval(heartbeat); for (const client of clients) client.end(); clients.clear(); },
    size: () => clients.size,
  };
}
