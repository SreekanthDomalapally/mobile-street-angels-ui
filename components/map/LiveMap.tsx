import { useMemo } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import type { Coordinates, Responder } from '@/types';
import { MOCK_USER_LOCATION } from '@/data/mock';

interface LiveMapProps {
  userLocation?: Coordinates;
  responders?: Responder[];
  className?: string;
}

export function LiveMap({
  userLocation = MOCK_USER_LOCATION,
  responders = [],
}: LiveMapProps) {
  const region = useMemo(
    () => ({
      latitude: userLocation.latitude,
      longitude: userLocation.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }),
    [userLocation.latitude, userLocation.longitude]
  );

  return (
    <View className="flex-1 overflow-hidden rounded-none">
      <MapView
        style={StyleSheet.absoluteFill}
        provider={Platform.OS === 'android' ? PROVIDER_DEFAULT : undefined}
        region={region}
        showsUserLocation
        showsMyLocationButton={false}
        customMapStyle={darkMapStyle}
        accessibilityLabel="Live map showing your location and responders">
        <Marker
          coordinate={userLocation}
          title="You"
          pinColor="#c94a4a"
          accessibilityLabel="Your location"
        />
        {responders
          .filter((r) => r.coordinates)
          .map((r) => (
            <Marker
              key={r.id}
              coordinate={r.coordinates!}
              title={r.name}
              description={r.status}
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
