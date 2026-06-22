import { TripWatchMap } from '@/components/trip/TripWatchMap';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { fetchTripWatch } from '@/services/api/tripWatch';
import { distanceKm, formatDistance, isWithinRadius } from '@/lib/geo';
import { formatTripTimeRemaining } from '@/lib/tripWatch';
import type { TripWatch } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TripWatchDetailScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [trip, setTrip] = useState<TripWatch | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(false);
    try {
      const result = await fetchTripWatch(id);
      setTrip(result);
      if (!result) setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!id || !trip || trip.status !== 'active') return;
    const interval = setInterval(() => {
      void load();
    }, 10000);
    return () => clearInterval(interval);
  }, [id, trip?.status, load]);

  if (loading) {
    return <LoadingState message="Loading trip…" />;
  }

  if (error || !trip) {
    return <ErrorState onRetry={() => void load()} />;
  }

  const atDestination =
    trip.destination &&
    trip.currentLocation &&
    isWithinRadius(trip.currentLocation, trip.destination);

  const distanceLabel =
    trip.destination && trip.currentLocation
      ? formatDistance(distanceKm(trip.currentLocation, trip.destination))
      : 'Location updating…';

  return (
    <View className="flex-1 bg-charcoal-950" style={{ paddingTop: insets.top }}>
      <View className="flex-row items-center gap-3 px-5 py-4">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-xl bg-charcoal-800">
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </Pressable>
        <View className="flex-1">
          <Text variant="title">{trip.travelerName ?? 'Trip watch'}</Text>
          <Text variant="caption" muted>
            {trip.label ?? trip.groupName} · {formatTripTimeRemaining(trip.expiresAt)}
          </Text>
        </View>
      </View>

      <View className="mx-5 h-72">
        <TripWatchMap travelerLocation={trip.currentLocation} destination={trip.destination} />
      </View>

      <View className="flex-1 px-5 pt-4">
        <View
          className={`mb-4 rounded-2xl border px-4 py-3 ${
            trip.status === 'arrived'
              ? 'border-responder/40 bg-responder/10'
              : 'border-glass-border bg-charcoal-900'
          }`}>
          <Text variant="subtitle">
            {trip.status === 'arrived'
              ? 'Arrived safely'
              : trip.status === 'ended'
                ? 'Trip ended'
                : atDestination
                  ? 'At destination'
                  : 'On the way'}
          </Text>
          <Text variant="body" muted className="mt-1">
            {trip.status === 'active' ? distanceLabel : trip.status}
          </Text>
        </View>

        {trip.isLocalOnly && (
          <Text variant="caption" muted className="leading-relaxed">
            This trip is only stored on the traveler&apos;s device until trip watch API endpoints
            are enabled on the server.
          </Text>
        )}

        {trip.status === 'active' && (
          <Button title="Refresh" variant="secondary" onPress={() => void load()} className="mt-4" />
        )}
      </View>
    </View>
  );
}
