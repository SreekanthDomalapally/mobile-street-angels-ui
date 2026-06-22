import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { formatTripTimeRemaining } from '@/lib/tripWatch';
import { isTripWatchLive, useTripWatchStore } from '@/stores/tripWatchStore';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { Pressable, View } from 'react-native';

export function TripWatchBanner() {
  const activeTrip = useTripWatchStore((s) => s.activeTrip);

  if (isTripWatchLive(activeTrip)) {
    return (
      <Pressable
        onPress={() => router.push('/trip/active' as Href)}
        className="mb-4 rounded-2xl border border-responder/30 bg-responder/10 p-4 active:opacity-90"
        accessibilityRole="button"
        accessibilityLabel="Open active trip watch">
        <View className="flex-row items-center gap-3">
          <View className="h-10 w-10 items-center justify-center rounded-xl bg-responder/20">
            <Ionicons name="navigate" size={20} color="#6bb892" />
          </View>
          <View className="flex-1">
            <Text variant="subtitle">Trip watch active</Text>
            <Text variant="caption" muted>
              {activeTrip?.label ?? activeTrip?.groupName ?? 'Sharing location'} ·{' '}
              {formatTripTimeRemaining(activeTrip!.expiresAt)}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#6bb892" />
        </View>
      </Pressable>
    );
  }

  return (
    <View className="mb-4 rounded-2xl border border-glass-border bg-charcoal-900 p-4">
      <View className="mb-3 flex-row items-start gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-xl bg-charcoal-800">
          <Ionicons name="walk-outline" size={20} color="#6bb892" />
        </View>
        <View className="flex-1">
          <Text variant="subtitle">Trip watch</Text>
          <Text variant="caption" muted className="mt-1 leading-relaxed">
            Share your journey with family for a set time. Parents get notified when you reach
            the destination.
          </Text>
        </View>
      </View>
      <Button
        title="Start trip watch"
        variant="secondary"
        onPress={() => router.push('/trip/start' as Href)}
      />
    </View>
  );
}
