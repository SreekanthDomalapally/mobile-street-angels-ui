import { fetchAlert, fetchAlerts } from '@/services/api/alerts';
import type { SOSAlert } from '@/types';
import { clearPersistedActiveAlert, getPersistedActiveAlertId } from './sosSession';

export function isLiveSOSAlert(alert: SOSAlert): boolean {
  return alert.status === 'active' || alert.status === 'responding';
}

function isOwnLiveAlert(alert: SOSAlert, creatorUserId: string): boolean {
  return alert.userId === creatorUserId && isLiveSOSAlert(alert);
}

/** Restore an in-progress SOS the current user sent (not alerts they received). */
export async function findActiveAlert(creatorUserId?: string | null): Promise<SOSAlert | null> {
  if (!creatorUserId) return null;

  const persistedId = await getPersistedActiveAlertId();
  if (persistedId) {
    try {
      const alert = await fetchAlert(persistedId);
      if (isOwnLiveAlert(alert, creatorUserId)) {
        return alert;
      }
      await clearPersistedActiveAlert();
    } catch {
      await clearPersistedActiveAlert();
    }
  }

  try {
    const alerts = await fetchAlerts();
    const live = alerts.find((alert) => isOwnLiveAlert(alert, creatorUserId));
    return live ?? null;
  } catch {
    return null;
  }
}
