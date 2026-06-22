import {
  endTripWatch,
  fetchActiveTripWatch,
  markTripArrived,
  updateTripWatchLocation,
} from '@/services/api/tripWatch';
import {
  clearPersistedActiveTrip,
  persistActiveTripId,
} from '@/services/tripWatchStorage';
import { isWithinRadius } from '@/lib/geo';
import { isTripExpired } from '@/lib/tripWatch';
import { watchLocation } from '@/services/location';
import { useTripWatchStore } from '@/stores/tripWatchStore';
import type { TripWatch } from '@/types';
import { useCallback, useEffect, useRef } from 'react';

export function useTripWatchTracking(trip: TripWatch | null, enabled: boolean) {
  const updateActiveTrip = useTripWatchStore((s) => s.updateActiveTrip);
  const setTracking = useTripWatchStore((s) => s.setTracking);
  const setLastSyncError = useTripWatchStore((s) => s.setLastSyncError);
  const arrivedRef = useRef(false);

  useEffect(() => {
    arrivedRef.current = trip?.status === 'arrived';
  }, [trip?.status]);

  useEffect(() => {
    if (!enabled || !trip || trip.status !== 'active') {
      setTracking(false);
      return;
    }

    let stopWatch: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        setTracking(true);
        stopWatch = await watchLocation(async (coords) => {
          if (cancelled || arrivedRef.current) return;

          updateActiveTrip({ currentLocation: coords });

          try {
            const updated = await updateTripWatchLocation(trip.id, coords);
            if (updated) {
              updateActiveTrip(updated);
              setLastSyncError(
                updated.isLocalOnly
                  ? 'Location saved on this device. Server sync pending for family viewers.'
                  : null
              );
            }

            if (
              updated?.destination &&
              isWithinRadius(coords, updated.destination) &&
              !arrivedRef.current
            ) {
              arrivedRef.current = true;
              const arrived = await markTripArrived(trip.id);
              if (arrived) {
                updateActiveTrip(arrived);
              }
            }
          } catch (error) {
            setLastSyncError(
              error instanceof Error ? error.message : 'Could not sync location.'
            );
          }

          if (isTripExpired(trip.expiresAt)) {
            const ended = await endTripWatch(trip.id);
            if (ended) {
              updateActiveTrip(ended);
              await clearPersistedActiveTrip();
            }
          }
        }, { highAccuracy: true });
      } catch (error) {
        setTracking(false);
        setLastSyncError(
          error instanceof Error ? error.message : 'Location tracking failed.'
        );
      }
    })();

    return () => {
      cancelled = true;
      stopWatch?.();
      setTracking(false);
    };
  }, [
    enabled,
    trip?.id,
    trip?.status,
    trip?.expiresAt,
    setTracking,
    setLastSyncError,
    updateActiveTrip,
  ]);
}

export function useTripWatchActions() {
  const setActiveTrip = useTripWatchStore((s) => s.setActiveTrip);
  const resetTripWatch = useTripWatchStore((s) => s.resetTripWatch);

  const finishTrip = useCallback(async (tripId: string) => {
    const ended = await endTripWatch(tripId);
    await clearPersistedActiveTrip();
    resetTripWatch();
    return ended;
  }, [resetTripWatch]);

  const arriveTrip = useCallback(
    async (tripId: string) => {
      const arrived = await markTripArrived(tripId);
      if (arrived) {
        setActiveTrip(arrived);
      }
      return arrived;
    },
    [setActiveTrip]
  );

  const restoreActiveTrip = useCallback(async () => {
    const trip = await fetchActiveTripWatch();
    if (trip && trip.status === 'active') {
      setActiveTrip(trip);
      await persistActiveTripId(trip.id);
    }
    return trip;
  }, [setActiveTrip]);

  return { finishTrip, arriveTrip, restoreActiveTrip };
}
