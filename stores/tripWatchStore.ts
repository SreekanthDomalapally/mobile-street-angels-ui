import { create } from 'zustand';
import type { TripWatch } from '@/types';

interface TripWatchState {
  activeTrip: TripWatch | null;
  isTracking: boolean;
  lastSyncError: string | null;
  setActiveTrip: (trip: TripWatch | null) => void;
  updateActiveTrip: (patch: Partial<TripWatch>) => void;
  setTracking: (value: boolean) => void;
  setLastSyncError: (message: string | null) => void;
  resetTripWatch: () => void;
}

export const useTripWatchStore = create<TripWatchState>((set) => ({
  activeTrip: null,
  isTracking: false,
  lastSyncError: null,
  setActiveTrip: (activeTrip) => set({ activeTrip }),
  updateActiveTrip: (patch) =>
    set((state) =>
      state.activeTrip ? { activeTrip: { ...state.activeTrip, ...patch } } : state
    ),
  setTracking: (isTracking) => set({ isTracking }),
  setLastSyncError: (lastSyncError) => set({ lastSyncError }),
  resetTripWatch: () =>
    set({ activeTrip: null, isTracking: false, lastSyncError: null }),
}));

export function isTripWatchLive(trip: TripWatch | null | undefined): boolean {
  return Boolean(trip && trip.status === 'active');
}
