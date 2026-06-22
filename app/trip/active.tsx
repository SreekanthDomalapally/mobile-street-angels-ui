import { TripWatchMap } from '@/components/trip/TripWatchMap';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useTripWatchActions, useTripWatchTracking } from '@/hooks/useTripWatchTracking';
import { distanceKm, formatDistance, isWithinRadius } from '@/lib/geo';
import { formatTripTimeRemaining, isTripExpired } from '@/lib/tripWatch';
import { clearPersistedActiveTrip } from '@/services/tripWatchStorage';
import { isTripWatchLive, useTripWatchStore } from '@/stores/tripWatchStore';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, type Href } from 'expo-router';
import { useCallback } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TripActiveScreen() {
  const insets = useSafeAreaInsets();
  const activeTrip = useTripWatchStore((s) => s.activeTrip);
  const isTracking = useTripWatchStore((s) => s.isTracking);
  const lastSyncError = useTripWatchStore((s) => s.lastSyncError);
  const { arriveTrip, finishTrip, restoreActiveTrip } = useTripWatchActions();

  useFocusEffect(
    useCallback(() => {
      if (!activeTrip) {
        void restoreActiveTrip();
      }
    }, [activeTrip, restoreActiveTrip])
  );

  useTripWatchTracking(activeTrip, isTripWatchLive(activeTrip));

  if (!activeTrip) {
    return (
      <View
        className="flex-1 items-center justify-center bg-charcoal-950 px-8"
        style={{ paddingTop: insets.top }}>
        <ActivityIndicator color="#6bb892" />
        <Text variant="body" muted className="mt-4 text-center">
          Loading trip watch…
        </Text>
        <Button
          title="Start a new trip"
          variant="ghost"
          className="mt-6"
          onPress={() => router.replace('/trip/start' as Href)}
        />
      </View>
    );
  }

  const atDestination =
    activeTrip.destination &&
    activeTrip.currentLocation &&
    isWithinRadius(activeTrip.currentLocation, activeTrip.destination);

  const distanceLabel =
    activeTrip.destination && activeTrip.currentLocation
      ? formatDistance(distanceKm(activeTrip.currentLocation, activeTrip.destination))
      : null;

  const handleArrive = async () => {
    await arriveTrip(activeTrip.id);
  };

  const handleEnd = async () => {
    await finishTrip(activeTrip.id);
    router.replace('/(tabs)' as Href);
  };

  if (activeTrip.status === 'arrived' || activeTrip.status === 'ended' || isTripExpired(activeTrip.expiresAt)) {
    return (
      <View
        className="flex-1 bg-charcoal-950 px-6"
        style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
        <View className="items-center">
          <Ionicons
            name={activeTrip.status === 'arrived' ? 'checkmark-circle' : 'flag-outline'}
            size={56}
            color="#6bb892"
          />
          <Text variant="hero" className="mt-4 text-center">
            {activeTrip.status === 'arrived' ? 'Arrived safely' : 'Trip ended'}
          </Text>
          <Text variant="body" muted className="mt-2 text-center">
            {activeTrip.label ?? activeTrip.groupName ?? 'Your group'} has been notified.
          </Text>
        </View>
        <Button title="Done" size="lg" className="mt-auto" onPress={handleEnd} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-charcoal-950" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-5 py-4">
        <View className="flex-1">
          <Text variant="title">{activeTrip.label ?? 'Trip watch'}</Text>
          <Text variant="caption" muted>
            {activeTrip.groupName} · {formatTripTimeRemaining(activeTrip.expiresAt)}
            {isTracking ? ' · Live' : ''}
          </Text>
        </View>
        <Pressable
          onPress={handleEnd}
          accessibilityRole="button"
          accessibilityLabel="End trip"
          className="rounded-full bg-charcoal-800 px-3 py-2">
          <Text variant="caption">End</Text>
        </Pressable>
      </View>

      <View className="mx-5 h-64">
        <TripWatchMap
          travelerLocation={activeTrip.currentLocation}
          destination={activeTrip.destination}
        />
      </View>

      <View className="flex-1 px-5 pt-4">
        {distanceLabel && (
          <Text variant="body" className="mb-2">
            {atDestination ? 'You are at the destination' : distanceLabel}
          </Text>
        )}

        {activeTrip.isLocalOnly && (
          <Text variant="caption" muted className="mb-3 leading-relaxed">
            Server sync pending — family viewers need the API trip endpoints enabled on Railway.
          </Text>
        )}

        {lastSyncError && (
          <Text variant="caption" className="mb-3 text-warning">
            {lastSyncError}
          </Text>
        )}

        <Button
          title="I've arrived safely"
          size="lg"
          onPress={handleArrive}
          className="mt-2"
        />
        <Button
          title="Stop sharing"
          variant="ghost"
          onPress={async () => {
            await finishTrip(activeTrip.id);
            await clearPersistedActiveTrip();
            router.replace('/(tabs)' as Href);
          }}
          className="mt-3"
        />
      </View>
    </View>
  );
}
