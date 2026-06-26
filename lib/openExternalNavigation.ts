import { Alert, Linking, Platform } from 'react-native';
import type { Coordinates } from '@/types';

export function buildMapsViewUrl(coords: Coordinates): string {
  const { latitude, longitude } = coords;
  const label = encodeURIComponent('SOS location');
  if (Platform.OS === 'ios') {
    return `maps:?q=${label}&ll=${latitude},${longitude}`;
  }
  return `geo:${latitude},${longitude}?q=${latitude},${longitude}(${label})`;
}

export function buildMapsNavigationUrl(coords: Coordinates): string {
  const { latitude, longitude } = coords;
  if (Platform.OS === 'android') {
    return `google.navigation:q=${latitude},${longitude}`;
  }
  return `maps://?daddr=${latitude},${longitude}&dirflg=d`;
}

function mapsWebFallback(coords: Coordinates, mode: 'view' | 'navigate'): string {
  const { latitude, longitude } = coords;
  if (mode === 'navigate') {
    return `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
}

export async function openExternalNavigation(
  coords: Coordinates,
  mode: 'view' | 'navigate' = 'navigate',
): Promise<void> {
  const primary = mode === 'navigate' ? buildMapsNavigationUrl(coords) : buildMapsViewUrl(coords);
  const fallback = mapsWebFallback(coords, mode);

  try {
    const canOpen = await Linking.canOpenURL(primary);
    await Linking.openURL(canOpen ? primary : fallback);
  } catch {
    await Linking.openURL(fallback);
  }
}

export function confirmOpenExternalNavigation(
  coords: Coordinates,
  options?: { mode?: 'view' | 'navigate'; title?: string },
): void {
  const mode = options?.mode ?? 'navigate';
  Alert.alert(
    options?.title ?? 'Open Google Maps?',
    'You will leave YouHoo Alert. Use your phone Back button or Recent Apps to return here.',
    [
      { text: 'Cancel', style: 'cancel' },
      {
        text: mode === 'navigate' ? 'Open navigation' : 'Open Maps',
        onPress: () => {
          void openExternalNavigation(coords, mode);
        },
      },
    ],
  );
}
