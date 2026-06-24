import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import type { Coordinates } from '@/types';

export const SOS_BACKGROUND_LOCATION_TASK = 'sos-background-location';

type LocationCallback = (coords: Coordinates) => void;

let activeCallback: LocationCallback | null = null;

TaskManager.defineTask(
  SOS_BACKGROUND_LOCATION_TASK,
  async ({
    data,
    error,
  }: TaskManager.TaskManagerTaskBody<{ locations: Location.LocationObject[] }>) => {
  if (error) {
    console.warn('[location] Background task error:', error);
    return;
  }
  const locations = data?.locations;
  const latest = locations?.[locations.length - 1];
  if (!latest || !activeCallback) return;
  activeCallback({
    latitude: latest.coords.latitude,
    longitude: latest.coords.longitude,
    accuracyMeters: latest.coords.accuracy ?? undefined,
  });
});

export async function startBackgroundLocationUpdates(
  onLocation: LocationCallback
): Promise<() => Promise<void>> {
  activeCallback = onLocation;
  const granted = await Location.requestBackgroundPermissionsAsync();
  if (granted.status !== 'granted') {
    throw new Error('Background location permission is required during active SOS.');
  }

  const started = await Location.hasStartedLocationUpdatesAsync(SOS_BACKGROUND_LOCATION_TASK);
  if (!started) {
    await Location.startLocationUpdatesAsync(SOS_BACKGROUND_LOCATION_TASK, {
      accuracy: Location.Accuracy.BestForNavigation,
      distanceInterval: 5,
      timeInterval: 3000,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'SOS active',
        notificationBody: 'Sharing your location with trusted contacts.',
      },
    });
  }

  return async () => {
    activeCallback = null;
    const running = await Location.hasStartedLocationUpdatesAsync(SOS_BACKGROUND_LOCATION_TASK);
    if (running) {
      await Location.stopLocationUpdatesAsync(SOS_BACKGROUND_LOCATION_TASK);
    }
  };
}
