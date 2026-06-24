import { updateMyLocation } from '@/services/api/responder';
import { getCurrentLocationIfPermitted } from '@/services/location';
import { getAccessToken } from '@/services/tokens';

/** Keep the user's last-known location fresh so responder distance/ETA works. */
const MIN_INTERVAL_MS = 5 * 60 * 1000;

let lastSyncedAt = 0;
let inFlight = false;

export async function syncMyLocation(force = false): Promise<void> {
  if (inFlight) return;

  const now = Date.now();
  if (!force && now - lastSyncedAt < MIN_INTERVAL_MS) return;

  const token = await getAccessToken();
  if (!token) return;

  inFlight = true;
  try {
    const coords = await getCurrentLocationIfPermitted();
    if (!coords) return;
    await updateMyLocation(coords.latitude, coords.longitude);
    lastSyncedAt = Date.now();
  } catch (error) {
    console.warn('[locationSync] Failed to sync location:', error);
  } finally {
    inFlight = false;
  }
}

export function resetLocationSync(): void {
  lastSyncedAt = 0;
}
