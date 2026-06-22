import { Text } from '@/components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, View } from 'react-native';
import type { Coordinates } from '@/types';

interface LocationFallbackProps {
  location: Coordinates;
  label?: string;
}

export function LocationFallback({ location, label = 'Your location' }: LocationFallbackProps) {
  const openMaps = () => {
    Linking.openURL(
      `https://maps.google.com/?q=${location.latitude},${location.longitude}`
    );
  };

  return (
    <View className="flex-1 items-center justify-center bg-charcoal-900 px-6">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-emergency/15">
        <Ionicons name="location" size={32} color="#e85d5d" />
      </View>
      <Text variant="label" className="mb-2">
        {label}
      </Text>
      <Text variant="body" className="text-center">
        {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
      </Text>
      {location.accuracyMeters != null && (
        <Text variant="caption" muted className="mt-2 text-center">
          Accuracy ~{Math.round(location.accuracyMeters)} m
        </Text>
      )}
      <Pressable
        onPress={openMaps}
        className="mt-6 rounded-2xl bg-charcoal-800 px-5 py-3 active:opacity-90"
        accessibilityRole="button"
        accessibilityLabel="Open location in maps app">
        <Text variant="body" className="text-responder-light">
          Open in Maps
        </Text>
      </Pressable>
      <Text variant="caption" muted className="mt-4 text-center leading-relaxed">
        Live map unavailable on this build. Location is still shared with your group.
      </Text>
    </View>
  );
}
