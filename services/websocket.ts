import { getAlertWebSocketUrl } from '@/services/api/client';
import {
  buildTimelineFromWsEvent,
  mapWsResponseToResponder,
} from '@/services/api/mappers';
import type { Responder, TimelineEvent } from '@/types';

type RespondersHandler = (responders: Responder[]) => void;
type TimelineHandler = (event: TimelineEvent) => void;
type StatusHandler = (status: string) => void;

const MAX_RECONNECT_ATTEMPTS = 8;

export class AlertWebSocket {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempts = 0;
  private alertId: string | null = null;
  private token: string | null = null;
  private responders: Responder[] = [];

  private onResponders?: RespondersHandler;
  private onTimeline?: TimelineHandler;
  private onStatus?: StatusHandler;

  connect(alertId: string, token: string) {
    this.disconnect(false);
    this.alertId = alertId;
    this.token = token;
    this.reconnectAttempts = 0;
    this.openSocket();
  }

  private openSocket() {
    if (!this.alertId || !this.token) return;

    try {
      const url = getAlertWebSocketUrl(this.alertId, this.token);
      this.ws = new WebSocket(url);

      this.ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data as string) as Record<string, unknown>;
          this.handlePayload(payload);
        } catch {
          // Ignore malformed frames.
        }
      };

      this.ws.onopen = () => {
        this.reconnectAttempts = 0;
      };

      this.ws.onclose = () => this.scheduleReconnect();
      this.ws.onerror = () => {
        this.ws?.close();
      };
    } catch {
      this.scheduleReconnect();
    }
  }

  private handlePayload(payload: Record<string, unknown>) {
    const type = String(payload.type ?? '');

    if (type === 'alert_response') {
      const responder = mapWsResponseToResponder(payload);
      if (responder) {
        this.responders = [...this.responders, responder];
        this.onResponders?.(this.responders);
      }
    }

    const timelineEvent = buildTimelineFromWsEvent(payload);
    if (timelineEvent) {
      this.onTimeline?.(timelineEvent);
    }

    if (type === 'alert_resolved' || type === 'alert_created') {
      const status = String(payload.status ?? type);
      this.onStatus?.(status);
    }
  }

  private scheduleReconnect() {
    if (!this.alertId || !this.token) return;
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;

    this.reconnectAttempts += 1;
    const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30_000);

    this.reconnectTimer = setTimeout(() => {
      this.openSocket();
    }, delay);
  }

  onRespondersUpdate(handler: RespondersHandler) {
    this.onResponders = handler;
  }

  onTimelineEvent(handler: TimelineHandler) {
    this.onTimeline = handler;
  }

  onStatusChange(handler: StatusHandler) {
    this.onStatus = handler;
  }

  disconnect(clearHandlers = true) {
    if (this.reconnectTimer) clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
    this.ws?.close();
    this.ws = null;
    this.alertId = null;
    this.token = null;
    this.responders = [];
    this.reconnectAttempts = 0;
    if (clearHandlers) {
      this.onResponders = undefined;
      this.onTimeline = undefined;
      this.onStatus = undefined;
    }
  }
}

export const alertSocket = new AlertWebSocket();
