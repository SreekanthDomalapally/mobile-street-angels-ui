import type { Coordinates, TripDestination, TripWatch, TripWatchStatus } from '@/types';

export interface ApiTripOut {
  id: string;
  group_id: string;
  group_name?: string | null;
  label?: string | null;
  status: TripWatchStatus;
  destination_latitude?: number | null;
  destination_longitude?: number | null;
  destination_label?: string | null;
  current_latitude?: number | null;
  current_longitude?: number | null;
  accuracy_meters?: number | null;
  started_at: string;
  expires_at: string;
  arrived_at?: string | null;
  ended_at?: string | null;
  traveler_user_id: string;
  traveler_name?: string | null;
}

function mapDestination(trip: ApiTripOut): TripDestination | undefined {
  if (trip.destination_latitude == null || trip.destination_longitude == null) {
    return undefined;
  }
  return {
    latitude: trip.destination_latitude,
    longitude: trip.destination_longitude,
    label: trip.destination_label ?? undefined,
  };
}

function mapCurrentLocation(trip: ApiTripOut): Coordinates | undefined {
  if (trip.current_latitude == null || trip.current_longitude == null) {
    return undefined;
  }
  return {
    latitude: trip.current_latitude,
    longitude: trip.current_longitude,
    accuracyMeters: trip.accuracy_meters ?? undefined,
  };
}

export function mapApiTripToTripWatch(trip: ApiTripOut): TripWatch {
  return {
    id: trip.id,
    groupId: trip.group_id,
    groupName: trip.group_name ?? undefined,
    label: trip.label ?? undefined,
    status: trip.status,
    destination: mapDestination(trip),
    currentLocation: mapCurrentLocation(trip),
    startedAt: trip.started_at,
    expiresAt: trip.expires_at,
    arrivedAt: trip.arrived_at ?? undefined,
    endedAt: trip.ended_at ?? undefined,
    travelerUserId: trip.traveler_user_id,
    travelerName: trip.traveler_name ?? undefined,
  };
}

export function mapTripWatchToActivityItem(trip: TripWatch) {
  const title =
    trip.status === 'arrived'
      ? `${trip.travelerName ?? 'Traveler'} arrived safely`
      : trip.status === 'active'
        ? `Trip watch: ${trip.label ?? trip.groupName ?? 'In progress'}`
        : `Trip ended: ${trip.label ?? trip.groupName ?? 'Watch session'}`;

  return {
    id: `trip-${trip.id}`,
    type: 'check_in' as const,
    title,
    subtitle: trip.groupName ?? 'Trip watch',
    timestamp: trip.arrivedAt ?? trip.endedAt ?? trip.startedAt,
  };
}
