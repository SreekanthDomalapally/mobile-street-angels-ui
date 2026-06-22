import { LocationFallback } from '@/components/map/LocationFallback';
import { isNativeMapSupported } from '@/lib/maps';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, {
  Circle,
  Marker,
  PROVIDER_GOOGLE,
  type Region,
  type UserLocationChangeEvent,
} from 'react-native-maps';
import type { Coordinates, Responder } from '@/types';

const STREET_LEVEL_DELTA = 0.006;
const MAX_ACCURACY_RADIUS_METERS = 500;

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

function isValidCoordinate(value: number | undefined): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isValidLocation(coords: Coordinates | null | undefined): coords is Coordinates {
  return Boolean(
    coords && isValidCoordinate(coords.latitude) && isValidCoordinate(coords.longitude)
  );
}

export function LiveMap({
  userLocation,
  responders = [],
  followUser = false,
  onLiveLocationChange,
}: LiveMapProps) {
  const mapRef = useRef<MapView>(null);
  const [liveCoords, setLiveCoords] = useState<Coordinates | null>(
    isValidLocation(userLocation) ? userLocation : null
  );
  const [accuracyMeters, setAccuracyMeters] = useState<number | undefined>(
    userLocation?.accuracyMeters
  );

  useEffect(() => {
    if (!isValidLocation(userLocation)) return;
    setLiveCoords(userLocation);
    setAccuracyMeters(userLocation.accuracyMeters);
    if (followUser) {
      mapRef.current?.animateToRegion(toRegion(userLocation), 400);
    }
  }, [followUser, userLocation?.latitude, userLocation?.longitude, userLocation?.accuracyMeters]);

  const initialRegion = useMemo(() => {
    if (!isValidLocation(userLocation)) return undefined;
    return toRegion(userLocation);
  }, [userLocation?.latitude, userLocation?.longitude]);

  const handleUserLocationChange = useCallback(
    (event: UserLocationChangeEvent) => {
      const coordinate = event.nativeEvent.coordinate;
      if (!coordinate) return;
      if (!isValidCoordinate(coordinate.latitude) || !isValidCoordinate(coordinate.longitude)) {
        return;
      }

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

  if (!isValidLocation(userLocation) || !initialRegion) {
    return <View className="flex-1 bg-charcoal-950" />;
  }

  if (!isNativeMapSupported()) {
    return <LocationFallback location={userLocation} />;
  }

  const accuracyRadius =
    accuracyMeters && accuracyMeters > 0
      ? Math.min(accuracyMeters, MAX_ACCURACY_RADIUS_METERS)
      : undefined;

  return (
    <View className="flex-1 overflow-hidden rounded-none">
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion}
        showsUserLocation
        showsMyLocationButton={followUser}
        followsUserLocation={followUser && Platform.OS === 'ios'}
        onUserLocationChange={Platform.OS === 'ios' ? handleUserLocationChange : undefined}
        customMapStyle={darkMapStyle}
        accessibilityLabel="Live map showing your location and responders">
        {liveCoords && accuracyRadius && (
          <Circle
            center={liveCoords}
            radius={accuracyRadius}
            fillColor="rgba(74, 143, 255, 0.12)"
            strokeColor="rgba(74, 143, 255, 0.35)"
            strokeWidth={1}
          />
        )}
        {responders
          .filter(
            (responder) =>
              responder.coordinates &&
              isValidCoordinate(responder.coordinates.latitude) &&
              isValidCoordinate(responder.coordinates.longitude)
          )
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
