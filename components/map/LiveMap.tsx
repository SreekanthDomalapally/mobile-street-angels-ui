import { LocationFallback } from '@/components/map/LocationFallback';
import { isNativeMapSupported } from '@/lib/maps';
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
const REGION_ANIMATE_MIN_MS = 1500;
const REGION_MOVE_THRESHOLD = 0.00008;

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

function movedEnough(prev: Coordinates | null, next: Coordinates): boolean {
  if (!prev) return true;
  return (
    Math.abs(prev.latitude - next.latitude) > REGION_MOVE_THRESHOLD ||
    Math.abs(prev.longitude - next.longitude) > REGION_MOVE_THRESHOLD
  );
}

const ResponderMarkers = memo(function ResponderMarkers({
  responders,
}: {
  responders: Responder[];
}) {
  const valid = useMemo(
    () =>
      responders.filter(
        (responder) =>
          responder.coordinates &&
          isValidCoordinate(responder.coordinates.latitude) &&
          isValidCoordinate(responder.coordinates.longitude)
      ),
    [responders]
  );

  return (
    <>
      {valid.map((responder) => (
        <Marker
          key={responder.id}
          coordinate={responder.coordinates!}
          title={responder.name}
          description={responder.status}
          pinColor="#4a8f6a"
        />
      ))}
    </>
  );
});

export function LiveMap({
  userLocation,
  responders = [],
  followUser = false,
  onLiveLocationChange,
}: LiveMapProps) {
  const mapRef = useRef<MapView>(null);
  const lastAnimatedAt = useRef(0);
  const lastAnimatedCoords = useRef<Coordinates | null>(null);
  const [liveCoords, setLiveCoords] = useState<Coordinates | null>(
    isValidLocation(userLocation) ? userLocation : null
  );
  const [accuracyMeters, setAccuracyMeters] = useState<number | undefined>(
    userLocation?.accuracyMeters
  );

  const animateIfNeeded = useCallback(
    (coords: Coordinates) => {
      if (!followUser) return;
      const now = Date.now();
      if (
        now - lastAnimatedAt.current < REGION_ANIMATE_MIN_MS &&
        !movedEnough(lastAnimatedCoords.current, coords)
      ) {
        return;
      }
      lastAnimatedAt.current = now;
      lastAnimatedCoords.current = coords;
      mapRef.current?.animateToRegion(toRegion(coords), 400);
    },
    [followUser]
  );

  useEffect(() => {
    if (!isValidLocation(userLocation)) return;
    setLiveCoords(userLocation);
    setAccuracyMeters(userLocation.accuracyMeters);
    animateIfNeeded(userLocation);
  }, [animateIfNeeded, userLocation?.latitude, userLocation?.longitude, userLocation?.accuracyMeters]);

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
      animateIfNeeded(coords);
    },
    [animateIfNeeded, onLiveLocationChange]
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
        <ResponderMarkers responders={responders} />
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
