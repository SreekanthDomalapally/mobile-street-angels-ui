import { LiveMap } from '@/components/map/LiveMap';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { confirmOpenExternalNavigation } from '@/lib/openExternalNavigation';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function parseCoordinate(value: string | string[] | undefined): number | null {
  const raw = Array.isArray(value) ? value[0] : value;
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : null;
}

export default function AlertNavigationScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ lat?: string; lng?: string; label?: string }>();

  const location = useMemo(() => {
    const latitude = parseCoordinate(params.lat);
    const longitude = parseCoordinate(params.lng);
    if (latitude == null || longitude == null) return null;
    return { latitude, longitude };
  }, [params.lat, params.lng]);

  const label =
    (Array.isArray(params.label) ? params.label[0] : params.label)?.trim() || 'SOS location';

  if (!location) {
    return (
      <View
        className="flex-1 items-center justify-center bg-charcoal-950 px-6"
        style={{ paddingTop: insets.top }}>
        <Text variant="body" muted className="mb-4 text-center">
          Could not open navigation — location is missing.
        </Text>
        <Button title="Go back" variant="secondary" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-charcoal-950">
      <View className="flex-1">
        <LiveMap userLocation={location} followUser={false} />
        <Pressable
          onPress={() => router.back()}
          className="absolute left-4 flex-row items-center gap-2 rounded-full bg-charcoal-900/95 px-4 py-2.5"
          style={{ top: insets.top + 8 }}
          accessibilityRole="button"
          accessibilityLabel="Back to alert">
          <Ionicons name="arrow-back" size={18} color="#ffffff" />
          <Text variant="caption">Back</Text>
        </Pressable>
      </View>

      <View
        className="border-t border-glass-border bg-charcoal-950 px-5 pt-4"
        style={{ paddingBottom: insets.bottom + 16 }}>
        <Text variant="label" className="mb-1">
          Navigate to
        </Text>
        <Text variant="body" className="mb-1">
          {label}
        </Text>
        <Text variant="caption" muted className="mb-4">
          {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
        </Text>
        <Button
          title="Start turn-by-turn in Google Maps"
          variant="primary"
          size="lg"
          icon={<Ionicons name="navigate" size={20} color="#fff" style={{ marginRight: 8 }} />}
          onPress={() => confirmOpenExternalNavigation(location, { mode: 'navigate' })}
        />
        <Text variant="caption" muted className="mt-3 text-center leading-relaxed">
          Stay on this screen to keep the alert open. External Maps opens only when you tap above.
        </Text>
      </View>
    </View>
  );
}
