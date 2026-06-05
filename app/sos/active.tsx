import { router } from 'expo-router';
import { useEffect } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiveMap } from '@/components/map/LiveMap';
import { EventTimeline } from '@/components/sos/EventTimeline';
import { ResponderCard } from '@/components/sos/ResponderCard';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Text } from '@/components/ui/Text';
import { updateAlertLocation } from '@/services/api/alerts';
import { getAccessToken } from '@/services/auth';
import { watchLocation } from '@/services/location';
import { scheduleEmergencyNotification } from '@/services/notifications';
import { endSOSAlert } from '@/services/sos';
import { alertSocket } from '@/services/websocket';
import { useSOSStore } from '@/stores/sosStore';

export default function SOSActiveScreen() {
  const insets = useSafeAreaInsets();
  const {
    activeAlert,
    cancelSOS,
    resolveAlert,
    updateResponders,
    addTimelineEvent,
    setActiveAlert,
  } = useSOSStore();

  useEffect(() => {
    if (!activeAlert) return;

    scheduleEmergencyNotification(
      'SOS Active',
      'Your trusted contacts have been notified. Help is on the way.'
    );

    let stopWatching: (() => void) | undefined;

    (async () => {
      const token = await getAccessToken();
      if (!token) return;

      alertSocket.connect(activeAlert.id, token);
      alertSocket.onRespondersUpdate(updateResponders);
      alertSocket.onTimelineEvent(addTimelineEvent);
      alertSocket.onStatusChange((status) => {
        if (status === 'resolved') {
          resolveAlert();
          router.replace('/(tabs)');
        }
      });

      stopWatching = await watchLocation(async (coords) => {
        const current = useSOSStore.getState().activeAlert;
        if (!current) return;
        try {
          await updateAlertLocation(current.id, coords);
          setActiveAlert({ ...current, location: coords });
        } catch {
          // Location updates are best-effort during an active alert.
        }
      });
    })();

    return () => {
      alertSocket.disconnect();
      stopWatching?.();
    };
    // Reconnect when alert id changes; location updates read fresh state via getState().
    // eslint-disable-next-line react-hooks/exhaustive-deps -- activeAlert object identity changes on each location tick
  }, [activeAlert?.id, addTimelineEvent, resolveAlert, setActiveAlert, updateResponders]);

  const handleEndAlert = async () => {
    if (!activeAlert) return;
    try {
      await endSOSAlert(activeAlert.id);
    } catch (error) {
      console.warn('[sos] Failed to resolve alert on server:', error);
    } finally {
      resolveAlert();
      router.replace('/(tabs)');
    }
  };

  const handleCancel = async () => {
    if (activeAlert) {
      try {
        await endSOSAlert(activeAlert.id);
      } catch {
        // Still clear local state if network fails.
      }
    }
    cancelSOS();
    router.back();
  };

  if (!activeAlert) {
    router.replace('/(tabs)');
    return null;
  }

  return (
    <View className="flex-1 bg-charcoal-950">
      <View className="h-[45%]">
        <LiveMap
          userLocation={activeAlert.location}
          responders={activeAlert.responders}
        />
        <View
          className="absolute left-0 right-0 flex-row items-center justify-between px-4"
          style={{ top: insets.top + 8 }}>
          <GlassCard className="px-4 py-2">
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full bg-emergency animate-pulse" />
              <Text variant="caption" className="text-emergency-glow font-semibold">
                SOS Active
              </Text>
            </View>
          </GlassCard>
          <Pressable
            onPress={handleCancel}
            className="rounded-full bg-charcoal-900/90 px-4 py-2"
            accessibilityRole="button"
            accessibilityLabel="Cancel SOS">
            <Text variant="caption">Cancel</Text>
          </Pressable>
        </View>
      </View>

      <ScrollView
        className="flex-1 rounded-t-3xl bg-charcoal-950 px-5"
        style={{ marginTop: -24 }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: 20 }}>
        <Text variant="title" className="mb-1">
          Help is coming
        </Text>
        <Text variant="body" muted className="mb-6">
          {activeAlert.responders.filter((r) => r.status === 'en_route').length} responder
          {activeAlert.responders.length !== 1 ? 's' : ''} on the way
        </Text>

        <Text variant="label" className="mb-3">
          Responders
        </Text>
        {activeAlert.responders.length === 0 ? (
          <Text variant="body" muted className="mb-4">
            Waiting for responses from your trusted group…
          </Text>
        ) : (
          activeAlert.responders.map((r) => <ResponderCard key={r.id} responder={r} />)
        )}

        <Text variant="label" className="mb-3 mt-6">
          Live timeline
        </Text>
        <EventTimeline events={activeAlert.timeline} />

        <View className="mt-6 gap-3">
          <Button title="I'm safe — end alert" variant="primary" onPress={handleEndAlert} />
          <Button title="Cancel alert" variant="ghost" onPress={handleCancel} />
        </View>
      </ScrollView>
    </View>
  );
}
