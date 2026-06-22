export type NotificationKind = 'sos_alert' | 'responder_update' | 'group_update' | 'unknown';

export interface ParsedNotificationPayload {
  kind: NotificationKind;
  alertId?: string;
  senderName?: string;
  alertType?: string;
  isOwnAlert?: boolean;
}

export function parseNotificationData(
  data: Record<string, unknown> | undefined
): ParsedNotificationPayload {
  if (!data) {
    return { kind: 'unknown' };
  }

  const alertIdRaw = data.alert_id ?? data.alertId;
  const alertId = typeof alertIdRaw === 'string' && alertIdRaw.length > 0 ? alertIdRaw : undefined;
  const typeRaw = String(data.type ?? data.notification_type ?? '').toLowerCase();

  let kind: NotificationKind = 'unknown';
  if (typeRaw === 'sos_alert' || typeRaw === 'emergency' || typeRaw === 'alert') {
    kind = 'sos_alert';
  } else if (typeRaw === 'responder_update' || typeRaw === 'alert_response') {
    kind = 'responder_update';
  } else if (typeRaw === 'group_update' || typeRaw === 'group_invite') {
    kind = 'group_update';
  } else if (alertId) {
    kind = 'sos_alert';
  }

  const senderName =
    typeof data.sender_name === 'string'
      ? data.sender_name
      : typeof data.senderName === 'string'
        ? data.senderName
        : undefined;

  const alertType =
    typeof data.alert_type === 'string'
      ? data.alert_type
      : typeof data.alertType === 'string'
        ? data.alertType
        : undefined;

  const isOwnAlert = data.is_own_alert === true || data.isOwnAlert === true;

  return { kind, alertId, senderName, alertType, isOwnAlert };
}
