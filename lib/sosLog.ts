import { captureMessage } from '@/lib/observability';

export type SosLogEvent =
  | 'SOS_BUTTON_PRESSED'
  | 'SOS_TRIGGERED'
  | 'ALERT_CREATED'
  | 'create_alert_payload'
  | 'NOTIFICATION_RECEIVED'
  | 'NOTIFICATION_OPENED'
  | 'NOTIFICATION_FAILED';

export interface SosLogFields {
  alert_id?: string;
  sender_user_id?: string;
  recipient_count?: number;
  recipient_user_ids?: string[];
  correlation_id?: string;
  selected_emergency_type?: string;
  create_alert_payload?: Record<string, unknown>;
  error?: string;
}

export function logSosEvent(event: SosLogEvent, fields: SosLogFields = {}): void {
  captureMessage(event, fields as Record<string, unknown>);
}
