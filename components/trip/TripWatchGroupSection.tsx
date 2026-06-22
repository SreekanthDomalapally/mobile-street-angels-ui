import { Text } from '@/components/ui/Text';
import { fetchGroupActiveTrips } from '@/services/api/tripWatch';
import { formatTripTimeRemaining } from '@/lib/tripWatch';
import type { TripWatch } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

interface TripWatchGroupSectionProps {
  groupId: string | null;
}

export function TripWatchGroupSection({ groupId }: TripWatchGroupSectionProps) {
  const [trips, setTrips] = useState<TripWatch[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!groupId) {
      setTrips([]);
      return;
    }
    setLoading(true);
    try {
      const active = await fetchGroupActiveTrips(groupId);
      setTrips(active);
    } catch {
      setTrips([]);
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!groupId) return null;

  return (
    <View className="mb-6">
      <View className="mb-2 flex-row items-center justify-between">
        <Text variant="label">Active trip watches</Text>
        <Pressable onPress={() => void load()} accessibilityRole="button">
          <Text variant="caption" className="text-responder-light">
            Refresh
          </Text>
        </Pressable>
      </View>

      {loading ? (
        <ActivityIndicator color="#6bb892" />
      ) : trips.length === 0 ? (
        <Text variant="caption" muted>
          No one is sharing a trip in this group right now.
        </Text>
      ) : (
        trips.map((trip) => (
          <Pressable
            key={trip.id}
            onPress={() => router.push(`/trip/${trip.id}` as Href)}
            className="mb-2 flex-row items-center gap-3 rounded-2xl border border-glass-border bg-charcoal-900 p-4 active:bg-charcoal-800"
            accessibilityRole="button"
            accessibilityLabel={`Watch trip for ${trip.travelerName ?? 'member'}`}>
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-responder/15">
              <Ionicons name="navigate" size={20} color="#6bb892" />
            </View>
            <View className="flex-1">
              <Text variant="body">{trip.travelerName ?? 'Member on a trip'}</Text>
              <Text variant="caption" muted>
                {trip.label ?? 'Trip watch'} · {formatTripTimeRemaining(trip.expiresAt)}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6d6d75" />
          </Pressable>
        ))
      )}

      <Pressable
        onPress={() => router.push('/trip/start' as Href)}
        className="mt-2 flex-row items-center justify-center gap-2 py-2"
        accessibilityRole="button">
        <Ionicons name="add-circle-outline" size={18} color="#6bb892" />
        <Text variant="caption" className="text-responder-light">
          Start your own trip watch
        </Text>
      </Pressable>
    </View>
  );
}
