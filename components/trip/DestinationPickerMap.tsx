import { LocationFallback } from '@/components/map/LocationFallback';
import { isNativeMapSupported } from '@/lib/maps';
import { ARRIVAL_RADIUS_METERS } from '@/lib/geo';
import type { Coordinates, TripDestination } from '@/types';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

const STREET_LEVEL_DELTA = 0.012;

interface DestinationPickerMapProps {
  userLocation?: Coordinates | null;
  destination?: TripDestination | null;
  onDestinationChange: (destination: TripDestination) => void;
  className?: string;
}

function toRegion(coords: Coordinates, delta = STREET_LEVEL_DELTA): Region {
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    latitudeDelta: delta,
    longitudeDelta: delta,
  };
}

export function DestinationPickerMap({
  userLocation,
  destination,
  onDestinationChange,
}: DestinationPickerMapProps) {
  const mapRef = useRef<MapView>(null);
  const [ready, setReady] = useState(false);

  const initialRegion = useMemo(() => {
    if (destination) return toRegion(destination);
    if (userLocation) return toRegion(userLocation);
    return undefined;
  }, [destination, userLocation]);

  useEffect(() => {
    if (!ready || !destination) return;
    mapRef.current?.animateToRegion(toRegion(destination), 400);
  }, [destination, ready]);

  const handlePress = useCallback(
    (event: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
      const { latitude, longitude } = event.nativeEvent.coordinate;
      onDestinationChange({ latitude, longitude, label: destination?.label ?? 'Destination' });
    },
    [destination?.label, onDestinationChange]
  );

  if (!userLocation || !initialRegion) {
    return <View className="flex-1 bg-charcoal-900" />;
  }

  if (!isNativeMapSupported()) {
    return <LocationFallback location={userLocation} />;
  }

  return (
    <View className="flex-1 overflow-hidden rounded-2xl">
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation
        onPress={handlePress}
        onMapReady={() => setReady(true)}
        accessibilityLabel="Map — tap to set destination">
        {destination && (
          <>
            <Marker
              coordinate={destination}
              title="Destination"
              pinColor="#6bb892"
            />
            <Circle
              center={destination}
              radius={ARRIVAL_RADIUS_METERS}
              fillColor="rgba(107, 184, 146, 0.15)"
              strokeColor="rgba(107, 184, 146, 0.5)"
              strokeWidth={1}
            />
          </>
        )}
      </MapView>
    </View>
  );
}
