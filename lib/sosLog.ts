import { captureMessage } from '@/lib/observability';

export type SosLogEvent =
  | 'SOS_TRIGGERED'
  | 'ALERT_CREATED'
  | 'NOTIFICATION_OPENED'
  | 'NOTIFICATION_FAILED';

export interface SosLogFields {
  alert_id?: string;
  sender_user_id?: string;
  recipient_count?: number;
  recipient_user_ids?: string[];
  correlation_id?: string;
  error?: string;
}

export function logSosEvent(event: SosLogEvent, fields: SosLogFields = {}): void {
  captureMessage(event, fields as Record<string, unknown>);
}
