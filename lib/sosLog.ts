import { captureMessage } from '@/lib/observability';

export type SosLogEvent =
  | 'SOS_PRESSED'
  | 'SOS_BUTTON_PRESSED'
  | 'SOS_EMERGENCY_TYPE_SELECTED'
  | 'SOS_CREATE_ALERT_PAYLOAD'
  | 'SOS_CREATE_ALERT_RESPONSE'
  | 'SOS_TRIGGERED'
  | 'ALERT_CREATED'
  | 'create_alert_payload'
  | 'PUSH_PERMISSION_STATUS'
  | 'EXPO_PUSH_TOKEN_GENERATED'
  | 'PUSH_TOKEN_REGISTERED_WITH_API'
  | 'PUSH_TOKEN_REGISTRATION_RESPONSE'
  | 'NOTIFICATION_RECEIVED'
  | 'NOTIFICATION_RECEIVED_ON_DEVICE'
  | 'NOTIFICATION_RESPONSE_OPENED'
  | 'NOTIFICATION_OPENED'
  | 'NOTIFICATION_ALERT_ID'
  | 'NOTIFICATION_FAILED';

export interface SosLogFields {
  alert_id?: string;
  sender_user_id?: string;
  recipient_count?: number;
  recipient_user_ids?: string[];
  correlation_id?: string;
  selected_emergency_type?: string;
  emergency_type?: string;
  create_alert_payload?: Record<string, unknown>;
  push_permission_status?: string;
  token_preview?: string;
  push_token_registered?: boolean;
  error?: string;
  push_failure_reason?: string;
}

export function logSosEvent(event: SosLogEvent, fields: SosLogFields = {}): void {
  captureMessage(event, fields as Record<string, unknown>);
}
