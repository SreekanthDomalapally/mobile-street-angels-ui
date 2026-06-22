import * as Location from 'expo-location';
import { Platform } from 'react-native';
import type { Coordinates } from '@/types';

type LocationOptions = {
  highAccuracy?: boolean;
};

function toCoordinates(location: Location.LocationObject): Coordinates {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracyMeters: location.coords.accuracy ?? undefined,
  };
}

async function ensureLocationServices(): Promise<void> {
  if (Platform.OS !== 'android') return;

  try {
    await Location.enableNetworkProviderAsync();
  } catch {
    // Network-assisted location is best-effort on Android.
  }
}

export async function requestLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status === 'granted';
}

export async function requestBackgroundLocationPermission(): Promise<boolean> {
  const { status } = await Location.requestBackgroundPermissionsAsync();
  return status === 'granted';
}

export async function hasLocationPermission(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status === 'granted';
}

export async function getCurrentLocation(
  options: LocationOptions = {}
): Promise<Coordinates | null> {
  const granted = await requestLocationPermission();
  if (!granted) return null;

  await ensureLocationServices();

  const location = await Location.getCurrentPositionAsync({
    accuracy: options.highAccuracy
      ? Location.Accuracy.BestForNavigation
      : Location.Accuracy.High,
  });

  return toCoordinates(location);
}

export async function watchLocation(
  callback: (coords: Coordinates) => void,
  options: LocationOptions = {}
): Promise<() => void> {
  const granted = await requestLocationPermission();
  if (!granted) {
    throw new Error('Location permission is required.');
  }

  await ensureLocationServices();

  const highAccuracy = options.highAccuracy ?? false;

  const subscription = await Location.watchPositionAsync(
    {
      accuracy: highAccuracy
        ? Location.Accuracy.BestForNavigation
        : Location.Accuracy.High,
      distanceInterval: highAccuracy ? 3 : 10,
      timeInterval: highAccuracy ? 2000 : 5000,
    },
    (location) => {
      callback(toCoordinates(location));
    }
  );

  return () => subscription.remove();
}
