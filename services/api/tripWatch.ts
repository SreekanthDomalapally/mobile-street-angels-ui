import { ApiError } from '@/services/api/http';
import type { Coordinates, TripDestination, TripWatch } from '@/types';
import { authenticatedRequest } from './client';
import { mapApiTripToTripWatch, type ApiTripOut } from './tripWatchMappers';
import {
  getLocalTrip,
  listLocalTrips,
  saveLocalTrip,
} from '@/services/tripWatchStorage';
import { useAuthStore } from '@/stores/authStore';
import type { TripDurationMinutes } from '@/lib/tripWatch';
import { tripExpiryIso } from '@/lib/tripWatch';

export interface CreateTripWatchParams {
  groupId: string;
  groupName?: string;
  label?: string;
  durationMinutes: TripDurationMinutes;
  destination?: TripDestination;
  startLocation?: Coordinates;
}

function createLocalTripId(): string {
  return `local-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function buildLocalTrip(params: CreateTripWatchParams): TripWatch {
  const user = useAuthStore.getState().user;
  const now = new Date().toISOString();
  return {
    id: createLocalTripId(),
    groupId: params.groupId,
    groupName: params.groupName,
    label: params.label,
    status: 'active',
    destination: params.destination,
    currentLocation: params.startLocation,
    startedAt: now,
    expiresAt: tripExpiryIso(params.durationMinutes),
    travelerUserId: user?.id ?? 'local-user',
    travelerName: user?.displayName,
    isLocalOnly: true,
  };
}

function isTripApiUnavailable(error: unknown): boolean {
  return error instanceof ApiError && (error.status === 404 || error.status === 501);
}

export async function createTripWatch(params: CreateTripWatchParams): Promise<TripWatch> {
  const body = {
    group_id: params.groupId,
    label: params.label,
    duration_minutes: params.durationMinutes,
    destination_latitude: params.destination?.latitude,
    destination_longitude: params.destination?.longitude,
    destination_label: params.destination?.label,
    latitude: params.startLocation?.latitude,
    longitude: params.startLocation?.longitude,
    accuracy_meters: params.startLocation?.accuracyMeters,
  };

  try {
    const trip = await authenticatedRequest<ApiTripOut>('/trips', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    return mapApiTripToTripWatch(trip);
  } catch (error) {
    if (!isTripApiUnavailable(error)) throw error;
    const local = buildLocalTrip(params);
    await saveLocalTrip(local);
    return local;
  }
}

export async function fetchTripWatch(tripId: string): Promise<TripWatch | null> {
  if (tripId.startsWith('local-')) {
    return getLocalTrip(tripId);
  }

  try {
    const trip = await authenticatedRequest<ApiTripOut>(`/trips/${tripId}`);
    return mapApiTripToTripWatch(trip);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      return getLocalTrip(tripId);
    }
    throw error;
  }
}

export async function fetchActiveTripWatch(): Promise<TripWatch | null> {
  try {
    const trip = await authenticatedRequest<ApiTripOut>('/trips/active/mine');
    return mapApiTripToTripWatch(trip);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 204)) {
      const localTrips = await listLocalTrips();
      const active = localTrips.find((t) => t.status === 'active');
      return active ?? null;
    }
    if (isTripApiUnavailable(error)) {
      const localTrips = await listLocalTrips();
      return localTrips.find((t) => t.status === 'active') ?? null;
    }
    throw error;
  }
}

export async function fetchGroupActiveTrips(groupId: string): Promise<TripWatch[]> {
  try {
    const trips = await authenticatedRequest<ApiTripOut[]>(`/groups/${groupId}/trips/active`);
    return trips.map(mapApiTripToTripWatch);
  } catch (error) {
    if (isTripApiUnavailable(error)) {
      const localTrips = await listLocalTrips();
      return localTrips.filter((t) => t.groupId === groupId && t.status === 'active');
    }
    if (error instanceof ApiError && error.status === 404) return [];
    throw error;
  }
}

async function patchLocalTrip(
  tripId: string,
  patch: Partial<TripWatch>
): Promise<TripWatch | null> {
  const existing = await getLocalTrip(tripId);
  if (!existing) return null;
  const next = { ...existing, ...patch };
  await saveLocalTrip(next);
  return next;
}

export async function updateTripWatchLocation(
  tripId: string,
  location: Coordinates
): Promise<TripWatch | null> {
  if (tripId.startsWith('local-')) {
    return patchLocalTrip(tripId, { currentLocation: location });
  }

  try {
    const trip = await authenticatedRequest<ApiTripOut>(`/trips/${tripId}/location`, {
      method: 'POST',
      body: JSON.stringify({
        latitude: location.latitude,
        longitude: location.longitude,
        accuracy_meters: location.accuracyMeters,
      }),
    });
    return mapApiTripToTripWatch(trip);
  } catch (error) {
    if (isTripApiUnavailable(error)) {
      return patchLocalTrip(tripId, { currentLocation: location, isLocalOnly: true });
    }
    throw error;
  }
}

export async function markTripArrived(tripId: string): Promise<TripWatch | null> {
  const arrivedAt = new Date().toISOString();

  if (tripId.startsWith('local-')) {
    return patchLocalTrip(tripId, { status: 'arrived', arrivedAt });
  }

  try {
    const trip = await authenticatedRequest<ApiTripOut>(`/trips/${tripId}/arrive`, {
      method: 'POST',
    });
    return mapApiTripToTripWatch(trip);
  } catch (error) {
    if (isTripApiUnavailable(error)) {
      return patchLocalTrip(tripId, { status: 'arrived', arrivedAt, isLocalOnly: true });
    }
    throw error;
  }
}

export async function endTripWatch(tripId: string): Promise<TripWatch | null> {
  const endedAt = new Date().toISOString();

  if (tripId.startsWith('local-')) {
    return patchLocalTrip(tripId, { status: 'ended', endedAt });
  }

  try {
    const trip = await authenticatedRequest<ApiTripOut>(`/trips/${tripId}/end`, {
      method: 'POST',
    });
    return mapApiTripToTripWatch(trip);
  } catch (error) {
    if (isTripApiUnavailable(error)) {
      return patchLocalTrip(tripId, { status: 'ended', endedAt, isLocalOnly: true });
    }
    throw error;
  }
}
