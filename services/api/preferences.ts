import type { NotificationPreferences } from '@/types';
import { ApiError } from './client';
import { authenticatedRequest } from './client';

export interface ApiNotificationPreferences {
  emergency_alerts: boolean;
  responder_updates: boolean;
  group_updates: boolean;
  marketing: boolean;
}

function mapFromApi(prefs: ApiNotificationPreferences): NotificationPreferences {
  return {
    emergencyAlerts: prefs.emergency_alerts,
    responderUpdates: prefs.responder_updates,
    groupUpdates: prefs.group_updates,
    marketing: prefs.marketing,
  };
}

function mapToApi(prefs: NotificationPreferences): ApiNotificationPreferences {
  return {
    emergency_alerts: prefs.emergencyAlerts,
    responder_updates: prefs.responderUpdates,
    group_updates: prefs.groupUpdates,
    marketing: prefs.marketing,
  };
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences | null> {
  try {
    const prefs = await authenticatedRequest<ApiNotificationPreferences>('/users/me/preferences');
    return mapFromApi(prefs);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 501)) {
      return null;
    }
    throw error;
  }
}

export async function updateNotificationPreferences(
  prefs: NotificationPreferences
): Promise<void> {
  try {
    await authenticatedRequest('/users/me/preferences', {
      method: 'PATCH',
      body: JSON.stringify(mapToApi(prefs)),
    });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 501)) {
      return;
    }
    throw error;
  }
}
