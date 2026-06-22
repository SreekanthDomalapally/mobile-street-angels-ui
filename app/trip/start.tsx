import { DestinationPickerMap } from '@/components/trip/DestinationPickerMap';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { useGroups } from '@/hooks/useGroups';
import { createTripWatch } from '@/services/api/tripWatch';
import { getCurrentLocation } from '@/services/location';
import { persistActiveTripId } from '@/services/tripWatchStorage';
import { useTripWatchStore } from '@/stores/tripWatchStore';
import {
  TRIP_DURATION_OPTIONS,
  type TripDurationMinutes,
} from '@/lib/tripWatch';
import type { TripDestination } from '@/types';
import { ApiError } from '@/services/api/client';
import { Ionicons } from '@expo/vector-icons';
import { router, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function TripStartScreen() {
  const insets = useSafeAreaInsets();
  const { data: groups, isLoading: groupsLoading } = useGroups();
  const setActiveTrip = useTripWatchStore((s) => s.setActiveTrip);

  const [label, setLabel] = useState('');
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [durationMinutes, setDurationMinutes] = useState<TripDurationMinutes>(60);
  const [destination, setDestination] = useState<TripDestination | null>(null);
  const [destinationLabel, setDestinationLabel] = useState('Home');
  const [userLocation, setUserLocation] = useState<Awaited<ReturnType<typeof getCurrentLocation>>>(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [skipDestination, setSkipDestination] = useState(false);

  useEffect(() => {
    if (groups?.length && !selectedGroupId) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    (async () => {
      setLoadingLocation(true);
      const loc = await getCurrentLocation({ highAccuracy: true });
      setUserLocation(loc);
      setLoadingLocation(false);
    })();
  }, []);

  const handleDestinationChange = (next: TripDestination) => {
    setDestination({ ...next, label: destinationLabel || next.label });
    setSkipDestination(false);
  };

  const handleStart = async () => {
    if (!selectedGroupId) {
      setError('Select a group to share your trip with.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const group = groups?.find((g) => g.id === selectedGroupId);
      const trip = await createTripWatch({
        groupId: selectedGroupId,
        groupName: group?.name,
        label: label.trim() || undefined,
        durationMinutes,
        destination:
          skipDestination || !destination
            ? undefined
            : { ...destination, label: destinationLabel.trim() || 'Destination' },
        startLocation: userLocation ?? undefined,
      });

      setActiveTrip(trip);
      await persistActiveTripId(trip.id);
      router.replace('/trip/active' as Href);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not start trip watch.');
    } finally {
      setSubmitting(false);
    }
  };

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
          <Text variant="title">Start trip watch</Text>
          <Text variant="caption" muted>
            Family can follow your journey until you arrive or time runs out.
          </Text>
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled">
        <Text variant="label" className="mb-2 mt-2">
          Trip name (optional)
        </Text>
        <Input
          value={label}
          onChangeText={setLabel}
          placeholder="e.g. Walk home from school"
          accessibilityLabel="Trip name"
        />

        <Text variant="label" className="mb-2 mt-4">
          Share with group
        </Text>
        {groupsLoading ? (
          <ActivityIndicator color="#6bb892" />
        ) : (
          <View className="gap-2">
            {(groups ?? []).map((group) => (
              <Pressable
                key={group.id}
                onPress={() => setSelectedGroupId(group.id)}
                className={`rounded-xl border px-4 py-3 ${
                  selectedGroupId === group.id
                    ? 'border-responder bg-responder/10'
                    : 'border-glass-border bg-charcoal-900'
                }`}>
                <Text variant="body">{group.name}</Text>
                <Text variant="caption" muted>
                  {group.memberCount} members
                  {group.isTemporary ? ' · Temporary' : ''}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <Text variant="label" className="mb-2 mt-4">
          Duration
        </Text>
        <View className="flex-row flex-wrap gap-2">
          {TRIP_DURATION_OPTIONS.map((option) => (
            <Pressable
              key={option.minutes}
              onPress={() => setDurationMinutes(option.minutes)}
              className={`rounded-full border px-4 py-2 ${
                durationMinutes === option.minutes
                  ? 'border-responder bg-responder/15'
                  : 'border-glass-border bg-charcoal-900'
              }`}>
              <Text variant="caption">{option.label}</Text>
            </Pressable>
          ))}
        </View>

        <View className="mb-2 mt-6 flex-row items-center justify-between">
          <Text variant="label">Destination</Text>
          <Pressable onPress={() => setSkipDestination((v) => !v)}>
            <Text variant="caption" className="text-responder-light">
              {skipDestination ? 'Set destination' : 'Skip destination'}
            </Text>
          </Pressable>
        </View>

        {!skipDestination && (
          <>
            <Input
              label="Destination name"
              value={destinationLabel}
              onChangeText={(text) => {
                setDestinationLabel(text);
                if (destination) {
                  setDestination({ ...destination, label: text });
                }
              }}
              placeholder="Home, School, Bus stop…"
              accessibilityLabel="Destination name"
            />
            <View className="mt-3 h-56">
              {loadingLocation ? (
                <View className="flex-1 items-center justify-center rounded-2xl bg-charcoal-900">
                  <ActivityIndicator color="#6bb892" />
                </View>
              ) : (
                <DestinationPickerMap
                  userLocation={userLocation}
                  destination={destination}
                  onDestinationChange={handleDestinationChange}
                />
              )}
            </View>
            <Text variant="caption" muted className="mt-2">
              Tap the map to set where you are heading. We notify your group when you arrive
              within ~150 m.
            </Text>
          </>
        )}

        {error && (
          <Text variant="caption" className="mt-4 text-emergency">
            {error}
          </Text>
        )}

        <Button
          title="Start sharing location"
          size="lg"
          className="mt-6"
          loading={submitting}
          onPress={handleStart}
        />
      </ScrollView>
    </View>
  );
}
