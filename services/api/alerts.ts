import type { EmergencyType, SOSAlert } from '@/types';
import { mockActiveAlert } from '@/data/mock';
import { delay } from '@/lib/utils';
import { apiRequest } from './client';

export async function createAlert(
  type: EmergencyType,
  location: { latitude: number; longitude: number },
  message?: string,
  token?: string
): Promise<SOSAlert> {
  try {
    return await apiRequest<SOSAlert>('/alerts', {
      method: 'POST',
      token,
      body: JSON.stringify({ type, location, message }),
    });
  } catch {
    await delay(600);
    return {
      ...mockActiveAlert,
      id: `alert-${Date.now()}`,
      type,
      createdAt: new Date().toISOString(),
      message,
    };
  }
}

export async function getAlert(alertId: string, token?: string): Promise<SOSAlert> {
  try {
    return await apiRequest<SOSAlert>(`/alerts/${alertId}`, { token });
  } catch {
    await delay(400);
    return { ...mockActiveAlert, id: alertId };
  }
}

export async function cancelAlert(alertId: string, token?: string): Promise<void> {
  try {
    await apiRequest<void>(`/alerts/${alertId}/cancel`, { method: 'POST', token });
  } catch {
    await delay(300);
  }
}

export async function getAlertHistory(token?: string): Promise<SOSAlert[]> {
  try {
    return await apiRequest<SOSAlert[]>('/alerts/history', { token });
  } catch {
    await delay(500);
    return [];
  }
}
