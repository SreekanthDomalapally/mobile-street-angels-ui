export type NotificationKind =
  | 'sos_alert'
  | 'responder_update'
  | 'group_update'
  | 'trip_watch'
  | 'check_in'
  | 'unknown';

export interface ParsedNotificationPayload {
  kind: NotificationKind;
  alertId?: string;
  tripId?: string;
  senderName?: string;
  alertType?: string;
  isOwnAlert?: boolean;
  correlationId?: string;
  senderUserId?: string;
}

export function parseNotificationData(
  data: Record<string, unknown> | undefined
): ParsedNotificationPayload {
  if (!data) {
    return { kind: 'unknown' };
  }

  const alertIdRaw = data.alert_id ?? data.alertId;
  const alertId = typeof alertIdRaw === 'string' && alertIdRaw.length > 0 ? alertIdRaw : undefined;
  const tripIdRaw = data.trip_id ?? data.tripId;
  const tripId = typeof tripIdRaw === 'string' && tripIdRaw.length > 0 ? tripIdRaw : undefined;
  const typeRaw = String(data.type ?? data.notification_type ?? '').toLowerCase();

  let kind: NotificationKind = 'unknown';
  if (typeRaw === 'sos_alert' || typeRaw === 'emergency' || typeRaw === 'alert') {
    kind = 'sos_alert';
  } else if (typeRaw === 'responder_update' || typeRaw === 'alert_response') {
    kind = 'responder_update';
  } else if (typeRaw === 'check_in' || typeRaw === 'trip_arrived') {
    kind = 'check_in';
  } else if (typeRaw === 'group_update' || typeRaw === 'group_invite' || typeRaw === 'trip_started') {
    kind = tripId ? 'trip_watch' : 'group_update';
  } else if (tripId) {
    kind = 'trip_watch';
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

  const correlationId =
    typeof data.correlation_id === 'string'
      ? data.correlation_id
      : typeof data.correlationId === 'string'
        ? data.correlationId
        : undefined;

  const senderUserId =
    typeof data.sender_user_id === 'string'
      ? data.sender_user_id
      : typeof data.senderUserId === 'string'
        ? data.senderUserId
        : undefined;

  return { kind, alertId, tripId, senderName, alertType, isOwnAlert, correlationId, senderUserId };
}
