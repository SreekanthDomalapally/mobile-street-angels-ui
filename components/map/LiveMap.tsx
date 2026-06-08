import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, {
  Circle,
  Marker,
  PROVIDER_DEFAULT,
  type Region,
  type UserLocationChangeEvent,
} from 'react-native-maps';
import type { Coordinates, Responder } from '@/types';

const STREET_LEVEL_DELTA = 0.006;

interface LiveMapProps {
  userLocation?: Coordinates | null;
  responders?: Responder[];
  followUser?: boolean;
  onLiveLocationChange?: (coords: Coordinates) => void;
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

export function LiveMap({
  userLocation,
  responders = [],
  followUser = false,
  onLiveLocationChange,
}: LiveMapProps) {
  const mapRef = useRef<MapView>(null);
  const [liveCoords, setLiveCoords] = useState<Coordinates | null>(userLocation ?? null);
  const [accuracyMeters, setAccuracyMeters] = useState<number | undefined>(
    userLocation?.accuracyMeters
  );

  useEffect(() => {
    if (!userLocation) return;
    setLiveCoords(userLocation);
    setAccuracyMeters(userLocation.accuracyMeters);
  }, [userLocation?.latitude, userLocation?.longitude, userLocation?.accuracyMeters]);

  const initialRegion = useMemo(() => {
    if (!userLocation) return undefined;
    return toRegion(userLocation);
  }, [userLocation?.latitude, userLocation?.longitude]);

  const handleUserLocationChange = useCallback(
    (event: UserLocationChangeEvent) => {
      const coordinate = event.nativeEvent.coordinate;
      if (!coordinate) return;

      const coords: Coordinates = {
        latitude: coordinate.latitude,
        longitude: coordinate.longitude,
        accuracyMeters: coordinate.accuracy,
      };

      setLiveCoords(coords);
      setAccuracyMeters(coordinate.accuracy);
      onLiveLocationChange?.(coords);

      if (followUser) {
        mapRef.current?.animateToRegion(toRegion(coords), 400);
      }
    },
    [followUser, onLiveLocationChange]
  );

  if (!initialRegion) {
    return <View className="flex-1 bg-charcoal-950" />;
  }

  return (
    <View className="flex-1 overflow-hidden rounded-none">
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_DEFAULT : undefined}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={followUser}
        followsUserLocation={followUser && Platform.OS === 'ios'}
        onUserLocationChange={handleUserLocationChange}
        customMapStyle={darkMapStyle}
        accessibilityLabel="Live map showing your location and responders">
        {liveCoords && accuracyMeters && accuracyMeters > 0 && (
          <Circle
            center={liveCoords}
            radius={accuracyMeters}
            fillColor="rgba(74, 143, 255, 0.12)"
            strokeColor="rgba(74, 143, 255, 0.35)"
            strokeWidth={1}
          />
        )}
        {responders
          .filter((responder) => responder.coordinates)
          .map((responder) => (
            <Marker
              key={responder.id}
              coordinate={responder.coordinates!}
              title={responder.name}
              description={responder.status}
              pinColor="#4a8f6a"
            />
          ))}
      </MapView>
    </View>
  );
}

const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#0F2442' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#6d6d75' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#0B1B32' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#152E52' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0B1B32' }] },
];
