import * as Location from 'expo-location';
import { Platform } from 'react-native';
import type { Coordinates } from '@/types';

export type LocationMode = 'idle' | 'active_sos' | 'responder';

type LocationOptions = {
  highAccuracy?: boolean;
  mode?: LocationMode;
  timeoutMs?: number;
};

const DEFAULT_HIGH_ACCURACY_TIMEOUT_MS = 8000;

function toCoordinates(location: Location.LocationObject): Coordinates {
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
    accuracyMeters: location.coords.accuracy ?? undefined,
  };
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(null), timeoutMs);
    promise
      .then((value) => {
        clearTimeout(timer);
        resolve(value);
      })
      .catch(() => {
        clearTimeout(timer);
        resolve(null);
      });
  });
}

function watchConfigForMode(mode: LocationMode) {
  switch (mode) {
    case 'active_sos':
      return {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5,
        timeInterval: 3000,
      };
    case 'responder':
      return {
        accuracy: Location.Accuracy.High,
        distanceInterval: 10,
        timeInterval: 5000,
      };
    default:
      return {
        accuracy: Location.Accuracy.Balanced,
        distanceInterval: 25,
        timeInterval: 10000,
      };
  }
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

/** Instant cached fix — never prompts. Use for SOS send path. */
export async function getLastKnownLocation(): Promise<Coordinates | null> {
  const granted = await hasLocationPermission();
  if (!granted) return null;

  try {
    const location = await Location.getLastKnownPositionAsync();
    return location ? toCoordinates(location) : null;
  } catch {
    return null;
  }
}

/** Last-known first, then optional high-accuracy refresh with timeout. */
export async function getSOSLocation(options: { timeoutMs?: number } = {}): Promise<Coordinates | null> {
  const granted = await hasLocationPermission();
  if (!granted) return null;

  const lastKnown = await getLastKnownLocation();
  if (lastKnown) return lastKnown;

  return getCurrentLocationIfPermitted({
    highAccuracy: true,
    timeoutMs: options.timeoutMs ?? DEFAULT_HIGH_ACCURACY_TIMEOUT_MS,
  });
}

export async function getCurrentLocation(
  options: LocationOptions = {}
): Promise<Coordinates | null> {
  const granted = await requestLocationPermission();
  if (!granted) return null;

  await ensureLocationServices();

  const request = Location.getCurrentPositionAsync({
    accuracy: options.highAccuracy
      ? Location.Accuracy.BestForNavigation
      : Location.Accuracy.High,
  });

  if (options.timeoutMs) {
    const result = await withTimeout(request, options.timeoutMs);
    return result ? toCoordinates(result) : null;
  }

  const location = await request;
  return toCoordinates(location);
}

/** Get location only if permission is already granted — never prompts. */
export async function getCurrentLocationIfPermitted(
  options: LocationOptions = {}
): Promise<Coordinates | null> {
  const granted = await hasLocationPermission();
  if (!granted) return null;

  await ensureLocationServices();

  const request = Location.getCurrentPositionAsync({
    accuracy: options.highAccuracy
      ? Location.Accuracy.BestForNavigation
      : Location.Accuracy.Balanced,
  });

  if (options.timeoutMs) {
    const result = await withTimeout(request, options.timeoutMs);
    return result ? toCoordinates(result) : null;
  }

  const location = await request;
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

  const mode = options.mode ?? (options.highAccuracy ? 'active_sos' : 'responder');
  const config = watchConfigForMode(mode);

  const subscription = await Location.watchPositionAsync(config, (location) => {
    callback(toCoordinates(location));
  });

  return () => subscription.remove();
}
