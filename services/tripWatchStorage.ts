import AsyncStorage from '@react-native-async-storage/async-storage';
import type { TripWatch } from '@/types';

const ACTIVE_TRIP_KEY = 'street-angels-active-trip-watch';
const LOCAL_TRIPS_KEY = 'street-angels-local-trip-watches';

export async function persistActiveTripId(tripId: string): Promise<void> {
  await AsyncStorage.setItem(ACTIVE_TRIP_KEY, tripId);
}

export async function getPersistedActiveTripId(): Promise<string | null> {
  return AsyncStorage.getItem(ACTIVE_TRIP_KEY);
}

export async function clearPersistedActiveTrip(): Promise<void> {
  await AsyncStorage.removeItem(ACTIVE_TRIP_KEY);
}

export async function saveLocalTrip(trip: TripWatch): Promise<void> {
  const raw = await AsyncStorage.getItem(LOCAL_TRIPS_KEY);
  const map: Record<string, TripWatch> = raw ? JSON.parse(raw) : {};
  map[trip.id] = trip;
  await AsyncStorage.setItem(LOCAL_TRIPS_KEY, JSON.stringify(map));
}

export async function getLocalTrip(tripId: string): Promise<TripWatch | null> {
  const raw = await AsyncStorage.getItem(LOCAL_TRIPS_KEY);
  if (!raw) return null;
  const map = JSON.parse(raw) as Record<string, TripWatch>;
  return map[tripId] ?? null;
}

export async function listLocalTrips(): Promise<TripWatch[]> {
  const raw = await AsyncStorage.getItem(LOCAL_TRIPS_KEY);
  if (!raw) return [];
  const map = JSON.parse(raw) as Record<string, TripWatch>;
  return Object.values(map);
}
