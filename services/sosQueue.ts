import AsyncStorage from '@react-native-async-storage/async-storage';
import { createSOSAlert } from '@/services/api/alerts';
import { shouldKeepQueuedSOS } from '@/lib/retryableError';
import type { Coordinates, EmergencyType, SOSAlert } from '@/types';

export interface FlushSOSQueueResult {
  alert: SOSAlert | null;
  remaining: number;
  lastError?: string;
}

const QUEUE_KEY = 'street-angels-pending-sos';

export interface PendingSOSPayload {
  groupId: string;
  emergencyType: EmergencyType;
  location: Coordinates;
  message?: string;
  createdAt: string;
}

export async function enqueuePendingSOS(payload: PendingSOSPayload): Promise<void> {
  const existing = await getPendingSOSQueue();
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify([...existing, payload]));
}

export async function getPendingSOSQueue(): Promise<PendingSOSPayload[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as PendingSOSPayload[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function clearPendingSOSQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

function flushErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Failed to send SOS alert.';
}

export async function flushPendingSOSQueue(): Promise<FlushSOSQueueResult> {
  const queue = await getPendingSOSQueue();
  if (!queue.length) return { alert: null, remaining: 0 };

  const remaining: PendingSOSPayload[] = [];
  let lastSent: SOSAlert | null = null;
  let lastError: string | undefined;

  for (const item of queue) {
    try {
      lastSent = await createSOSAlert({
        groupId: item.groupId,
        emergencyType: item.emergencyType,
        location: item.location,
        message: item.message,
      });
    } catch (error) {
      lastError = flushErrorMessage(error);
      if (shouldKeepQueuedSOS(error)) {
        remaining.push(item);
      } else {
        console.warn('[sosQueue] Dropping non-retryable queued alert:', error);
      }
    }
  }

  if (remaining.length) {
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(remaining));
  } else {
    await clearPendingSOSQueue();
  }

  return { alert: lastSent, remaining: remaining.length, lastError };
}
