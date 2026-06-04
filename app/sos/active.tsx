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
import { alertSocket, simulateResponderUpdates } from '@/services/websocket';
import { scheduleEmergencyNotification } from '@/services/notifications';
import { useSOSStore } from '@/stores/sosStore';

export default function SOSActiveScreen() {
  const insets = useSafeAreaInsets();
  const { activeAlert, cancelSOS, resolveAlert, updateResponders, addTimelineEvent } =
    useSOSStore();

  useEffect(() => {
    if (!activeAlert) return;

    scheduleEmergencyNotification(
      'SOS Active',
      'Your trusted contacts have been notified. Help is on the way.'
    );

    alertSocket.connect(activeAlert.id);
    const cleanup = simulateResponderUpdates(
      (responders) => updateResponders(responders),
      addTimelineEvent
    );

    return () => {
      alertSocket.disconnect();
      cleanup();
    };
  }, [activeAlert?.id, addTimelineEvent, updateResponders]);

  const handleCancel = () => {
    cancelSOS();
    router.back();
  };

  const handleResolve = () => {
    resolveAlert();
    router.replace('/(tabs)');
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
        {activeAlert.responders.map((r) => (
          <ResponderCard key={r.id} responder={r} />
        ))}

        <Text variant="label" className="mb-3 mt-6">
          Live timeline
        </Text>
        <EventTimeline events={activeAlert.timeline} />

        <View className="mt-6 gap-3">
          <Button title="I'm safe — end alert" variant="primary" onPress={handleResolve} />
          <Button title="Cancel alert" variant="ghost" onPress={handleCancel} />
        </View>
      </ScrollView>
    </View>
  );
}
