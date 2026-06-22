import { fetchAlert, fetchAlerts } from '@/services/api/alerts';
import type { SOSAlert } from '@/types';
import { clearPersistedActiveAlert, getPersistedActiveAlertId } from './sosSession';

export function isLiveSOSAlert(alert: SOSAlert): boolean {
  return alert.status === 'active' || alert.status === 'responding';
}

/** Restore an in-progress SOS from local storage or the alerts API. */
export async function findActiveAlert(): Promise<SOSAlert | null> {
  const persistedId = await getPersistedActiveAlertId();
  if (persistedId) {
    try {
      const alert = await fetchAlert(persistedId);
      if (isLiveSOSAlert(alert)) {
        return alert;
      }
      await clearPersistedActiveAlert();
    } catch {
      await clearPersistedActiveAlert();
    }
  }

  try {
    const alerts = await fetchAlerts();
    const live = alerts.find(isLiveSOSAlert);
    return live ?? null;
  } catch {
    return null;
  }
}
