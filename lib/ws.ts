import type { WsMessage } from "@/lib/types";

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 15000;

type MessageHandler = (msg: WsMessage) => void;

export class WsClient {
  private ws: WebSocket | null = null;
  private url: string;
  private handlers = new Set<MessageHandler>();
  private openHandlers = new Set<() => void>();
  private closeHandlers = new Set<() => void>();
  private destroyed = false;
  private reconnectAttempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(url: string) {
    this.url = url;
    this.connect();
  }

  onMessage(handler: MessageHandler): () => void {
    this.handlers.add(handler);
    return () => this.handlers.delete(handler);
  }

  onOpen(handler: () => void): () => void {
    this.openHandlers.add(handler);
    return () => this.openHandlers.delete(handler);
  }

  onClose(handler: () => void): () => void {
    this.closeHandlers.add(handler);
    return () => this.closeHandlers.delete(handler);
  }

  destroy(): void {
    this.destroyed = true;
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.onmessage = null;
      this.ws.onerror = null;
      this.ws.onopen = null;
      this.ws.close();
    }
    this.handlers.clear();
    this.openHandlers.clear();
    this.closeHandlers.clear();
  }

  private connect(): void {
    if (this.destroyed) return;
    this.ws = new WebSocket(this.url);

    this.ws.onopen = () => {
      this.reconnectAttempt = 0;
      for (const handler of this.openHandlers) handler();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const msg = JSON.parse(event.data) as WsMessage;
        for (const handler of this.handlers) {
          handler(msg);
        }
      } catch {
        // Ignore malformed messages
      }
    };

    this.ws.onclose = () => {
      for (const handler of this.closeHandlers) handler();
      if (this.destroyed) return;
      const delay = Math.min(RECONNECT_BASE_MS * 2 ** this.reconnectAttempt, RECONNECT_MAX_MS);
      this.reconnectAttempt++;
      this.reconnectTimer = setTimeout(() => this.connect(), delay);
    };

    this.ws.onerror = () => {
      this.ws?.close();
    };
  }
}
