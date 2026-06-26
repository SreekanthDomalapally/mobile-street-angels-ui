import type { Coordinates, EmergencyType, SOSAlert } from '@/types';
import {
  mapApiAlertToSOSAlert,
  mapEmergencyTypeToApi,
  type ApiAlertOut,
} from './mappers';
import { authenticatedRequest } from './client';

export interface CreateAlertParams {
  groupId: string;
  emergencyType: EmergencyType;
  location: Coordinates;
  message?: string;
}

export async function createSOSAlert(params: CreateAlertParams): Promise<SOSAlert> {
  const body = {
    group_id: params.groupId,
    alert_type: mapEmergencyTypeToApi(params.emergencyType),
    latitude: params.location.latitude,
    longitude: params.location.longitude,
    message: params.message,
  };

  const { logSosEvent } = await import('@/lib/sosLog');
  logSosEvent('SOS_CREATE_ALERT_PAYLOAD', { create_alert_payload: body });

  const alert = await authenticatedRequest<ApiAlertOut>('/alerts', {
    method: 'POST',
    body: JSON.stringify(body),
  });

  logSosEvent('SOS_CREATE_ALERT_RESPONSE', {
    alert_id: alert.id,
    recipient_count: alert.recipient_count ?? undefined,
    sender_user_id: alert.created_by,
  });

  return mapApiAlertToSOSAlert(alert);
}

export async function fetchAlerts(): Promise<SOSAlert[]> {
  const alerts = await authenticatedRequest<ApiAlertOut[]>('/alerts');
  return alerts.map(mapApiAlertToSOSAlert);
}

export async function fetchAlert(alertId: string): Promise<SOSAlert> {
  const alert = await authenticatedRequest<ApiAlertOut>(`/alerts/${alertId}`);
  return mapApiAlertToSOSAlert(alert);
}

export async function resolveSOSAlert(alertId: string): Promise<SOSAlert> {
  const alert = await authenticatedRequest<ApiAlertOut>(`/alerts/${alertId}/resolve`, {
    method: 'POST',
  });
  return mapApiAlertToSOSAlert(alert);
}

export type ApiResponseType =
  | 'i_can_help'
  | 'on_my_way'
  | 'calling_now'
  | 'unable_to_help';

export async function respondToAlert(
  alertId: string,
  responseType: ApiResponseType,
  etaMinutes?: number
): Promise<void> {
  await authenticatedRequest(`/alerts/${alertId}/responses`, {
    method: 'POST',
    body: JSON.stringify({
      response_type: responseType,
      eta_minutes: etaMinutes,
    }),
  });
}

export async function updateAlertLocation(
  alertId: string,
  location: Coordinates,
  accuracyMeters?: number
): Promise<void> {
  await authenticatedRequest(`/alerts/${alertId}/location`, {
    method: 'POST',
    body: JSON.stringify({
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy_meters: accuracyMeters,
    }),
  });
}
