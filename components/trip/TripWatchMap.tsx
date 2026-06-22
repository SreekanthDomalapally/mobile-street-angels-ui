import { LocationFallback } from '@/components/map/LocationFallback';
import { isNativeMapSupported } from '@/lib/maps';
import { ARRIVAL_RADIUS_METERS } from '@/lib/geo';
import type { Coordinates, TripDestination } from '@/types';
import { useEffect, useMemo, useRef } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Circle, Marker, PROVIDER_GOOGLE, type Region } from 'react-native-maps';

interface TripWatchMapProps {
  travelerLocation?: Coordinates | null;
  destination?: TripDestination | null;
  followTraveler?: boolean;
}

function toRegion(a: Coordinates, b?: Coordinates): Region {
  if (!b) {
    return {
      latitude: a.latitude,
      longitude: a.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
  }

  const minLat = Math.min(a.latitude, b.latitude);
  const maxLat = Math.max(a.latitude, b.latitude);
  const minLon = Math.min(a.longitude, b.longitude);
  const maxLon = Math.max(a.longitude, b.longitude);
  const pad = 0.008;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLon + maxLon) / 2,
    latitudeDelta: Math.max(maxLat - minLat + pad, 0.01),
    longitudeDelta: Math.max(maxLon - minLon + pad, 0.01),
  };
}

export function TripWatchMap({
  travelerLocation,
  destination,
  followTraveler = true,
}: TripWatchMapProps) {
  const mapRef = useRef<MapView>(null);

  const region = useMemo(() => {
    if (travelerLocation && destination) return toRegion(travelerLocation, destination);
    if (travelerLocation) return toRegion(travelerLocation);
    if (destination) return toRegion(destination);
    return undefined;
  }, [travelerLocation, destination]);

  useEffect(() => {
    if (!region || !followTraveler) return;
    mapRef.current?.animateToRegion(region, 500);
  }, [followTraveler, region?.latitude, region?.longitude]);

  if (!region) {
    return <View className="flex-1 bg-charcoal-900" />;
  }

  if (!isNativeMapSupported()) {
    return travelerLocation ? (
      <LocationFallback location={travelerLocation} />
    ) : (
      <View className="flex-1 bg-charcoal-900" />
    );
  }

  return (
    <View className="flex-1 overflow-hidden rounded-2xl">
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        accessibilityLabel="Trip watch map">
        {travelerLocation && (
          <Marker coordinate={travelerLocation} title="Traveler" pinColor="#4a8fff" />
        )}
        {destination && (
          <>
            <Marker coordinate={destination} title={destination.label ?? 'Destination'} pinColor="#6bb892" />
            <Circle
              center={destination}
              radius={ARRIVAL_RADIUS_METERS}
              fillColor="rgba(107, 184, 146, 0.12)"
              strokeColor="rgba(107, 184, 146, 0.45)"
              strokeWidth={1}
            />
          </>
        )}
      </MapView>
    </View>
  );
}
