import type { Responder, TimelineEvent } from '@/types';

type MessageHandler = (data: unknown) => void;

const WS_URL = process.env.EXPO_PUBLIC_WS_URL ?? 'wss://api.streetangels.example/ws';

export class AlertWebSocket {
  private ws: WebSocket | null = null;
  private handlers: Map<string, MessageHandler[]> = new Map();
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private alertId: string | null = null;

  connect(alertId: string, token?: string) {
    this.alertId = alertId;
    const url = `${WS_URL}?alertId=${alertId}${token ? `&token=${token}` : ''}`;

    try {
      this.ws = new WebSocket(url);
      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data as string);
          const type = payload.type as string;
          const handlers = this.handlers.get(type) ?? [];
          handlers.forEach((h) => h(payload.data));
        } catch {
          // Mock mode: ignore parse errors when no server
        }
      };
      this.ws.onclose = () => this.scheduleReconnect();
      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      // Offline / demo: no WebSocket server
    }
  }

  private scheduleReconnect() {
    if (!this.alertId) return;
    this.reconnectTimer = setTimeout(() => {
      if (this.alertId) this.connect(this.alertId);
    }, 5000);
  }

  on(event: 'responders' | 'timeline' | 'status', handler: MessageHandler) {
    const list = this.handlers.get(event) ?? [];
    list.push(handler);
    this.handlers.set(event, list);
  }

  sendStatusUpdate(status: string) {
    this.ws?.send(JSON.stringify({ type: 'status_update', status }));
  }

  disconnect() {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.ws?.close();
    this.ws = null;
    this.alertId = null;
    this.handlers.clear();
  }
}

export const alertSocket = new AlertWebSocket();

export function simulateResponderUpdates(
  onResponders: (responders: Responder[]) => void,
  onTimeline: (event: TimelineEvent) => void
): () => void {
  const interval = setInterval(() => {
    onTimeline({
      id: `sim-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: 'Location updated',
      type: 'system',
    });
  }, 15000);
  return () => clearInterval(interval);
}
