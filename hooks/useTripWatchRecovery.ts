import { fetchActiveTripWatch } from '@/services/api/tripWatch';
import { getPersistedActiveTripId, persistActiveTripId } from '@/services/tripWatchStorage';
import { useTripWatchStore } from '@/stores/tripWatchStore';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';

/** Restore an in-progress trip watch after app relaunch. */
export function useTripWatchRecovery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const setActiveTrip = useTripWatchStore((s) => s.setActiveTrip);

  useEffect(() => {
    if (!isAuthenticated) return;

    let cancelled = false;

    (async () => {
      try {
        const persistedId = await getPersistedActiveTripId();
        const trip = await fetchActiveTripWatch();
        if (cancelled) return;

        if (trip && trip.status === 'active') {
          setActiveTrip(trip);
          if (!persistedId) {
            await persistActiveTripId(trip.id);
          }
        }
      } catch (error) {
        console.warn('[tripWatch] Recovery failed:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, setActiveTrip]);
}
