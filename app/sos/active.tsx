import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, BackHandler, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiveMap } from '@/components/map/LiveMap';
import { EventTimeline } from '@/components/sos/EventTimeline';
import { EmergencyDisclaimer } from '@/components/sos/EmergencyDisclaimer';
import { ResponderCard } from '@/components/sos/ResponderCard';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { LoadingState } from '@/components/common/LoadingState';
import { Text } from '@/components/ui/Text';
import { openAppSettings } from '@/lib/openAppSettings';
import { updateAlertLocation } from '@/services/api/alerts';
import { getAccessToken } from '@/services/tokens';
import { getCurrentLocation, requestBackgroundLocationPermission, watchLocation } from '@/services/location';
import { startBackgroundLocationUpdates } from '@/services/backgroundLocation';
import { scheduleEmergencyNotification } from '@/services/notifications';
import { findActiveAlert } from '@/services/sosRecovery';
import { endSOSAlert } from '@/services/sos';
import { alertSocket } from '@/services/websocket';
import { useSOSStore } from '@/stores/sosStore';
import type { Coordinates } from '@/types';

export default function SOSActiveScreen() {
  const insets = useSafeAreaInsets();
  const {
    activeAlert,
    resetSOS,
    updateResponders,
    addTimelineEvent,
    setActiveAlert,
  } = useSOSStore();
  const [recovering, setRecovering] = useState(!activeAlert);
  const [locationWarning, setLocationWarning] = useState<string | null>(null);
  const [locationPushFailed, setLocationPushFailed] = useState(false);

  const exitToHome = useCallback(() => {
    resetSOS();
    router.replace('/(tabs)');
  }, [resetSOS]);

  // Recover alert if store was cleared (e.g. app was killed) before redirecting home.
  useEffect(() => {
    if (activeAlert) {
      setRecovering(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const recovered = await findActiveAlert();
        if (cancelled) return;
        if (recovered) {
          setActiveAlert(recovered);
          return;
        }
        router.replace('/(tabs)');
      } catch (error) {
        console.warn('[sos] Active screen recovery failed:', error);
        if (!cancelled) {
          router.replace('/(tabs)');
        }
      } finally {
        if (!cancelled) {
          setRecovering(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [activeAlert, setActiveAlert]);

  useEffect(() => {
    if (!activeAlert) return;

    const subscription = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => subscription.remove();
  }, [activeAlert]);

  useEffect(() => {
    if (!activeAlert) return;

    let cancelled = false;
    let stopWatching: (() => void) | undefined;
    let stopBackground: (() => Promise<void>) | undefined;

    scheduleEmergencyNotification(
      'SOS Active',
      'Your trusted contacts have been notified. Help is on the way.'
    ).catch((error) => {
      console.warn('[sos] Local notification failed:', error);
    });

    (async () => {
      try {
        const token = await getAccessToken();
        if (!token || cancelled) return;

        alertSocket.connect(activeAlert.id, token);
        alertSocket.onRespondersUpdate(updateResponders);
        alertSocket.onTimelineEvent(addTimelineEvent);
        alertSocket.onStatusChange((status) => {
          if (status === 'resolved') {
            exitToHome();
          }
        });
        alertSocket.onLocationUpdate((coords) => {
          const current = useSOSStore.getState().activeAlert;
          if (!current) return;
          setActiveAlert({ ...current, location: coords });
        });

        const pushLocation = async (coords: Coordinates) => {
          const current = useSOSStore.getState().activeAlert;
          if (!current || cancelled) return;
          try {
            await updateAlertLocation(current.id, coords, coords.accuracyMeters);
            setActiveAlert({ ...current, location: coords });
            setLocationPushFailed(false);
          } catch {
            setLocationPushFailed(true);
          }
        };

        const freshLocation = await getCurrentLocation({ highAccuracy: true });
        if (!freshLocation && !cancelled) {
          setLocationWarning(
            'Location unavailable — responders may not see your latest position. Check location permissions.'
          );
        }
        if (freshLocation && !cancelled) {
          await pushLocation(freshLocation);
        }

        const bgGranted = await requestBackgroundLocationPermission();
        if (!bgGranted && !cancelled) {
          setLocationWarning(
            'Background location is off — your position may stop updating if you leave the app.'
          );
        }

        if (!cancelled) {
          stopWatching = await watchLocation(pushLocation, { highAccuracy: true });
          try {
            stopBackground = await startBackgroundLocationUpdates(pushLocation);
          } catch {
            // Foreground watch still active if background task unavailable.
          }
        }
      } catch (error) {
        console.warn('[sos] Active alert setup failed:', error);
        setLocationWarning('Could not start live location sharing. Check permissions in Settings.');
      }
    })();

    return () => {
      cancelled = true;
      alertSocket.disconnect();
      stopWatching?.();
      void stopBackground?.();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- activeAlert object identity changes on each location tick
  }, [activeAlert?.id, addTimelineEvent, exitToHome, setActiveAlert, updateResponders]);

  const handleEndAlert = async () => {
    if (!activeAlert) return;
    try {
      await endSOSAlert(activeAlert.id);
    } catch (error) {
      console.warn('[sos] Failed to resolve alert on server:', error);
    } finally {
      exitToHome();
    }
  };

  const confirmCancel = () => {
    Alert.alert(
      'Cancel SOS alert?',
      'Your trusted contacts will be told the alert has ended. Only cancel if you are safe.',
      [
        { text: 'Keep alert active', style: 'cancel' },
        { text: 'Cancel alert', style: 'destructive', onPress: () => void handleCancel() },
      ]
    );
  };

  const handleCancel = async () => {
    if (activeAlert) {
      try {
        await endSOSAlert(activeAlert.id);
      } catch {
        // Still clear local state if network fails.
      }
    }
    exitToHome();
  };

  if (recovering || !activeAlert) {
    return <LoadingState message="Restoring your active alert…" />;
  }

  const enRouteCount = activeAlert.responders.filter((r) => r.status === 'en_route').length;

  return (
    <View className="flex-1 bg-charcoal-950">
      <View className="h-[45%]">
        <LiveMap
          userLocation={activeAlert.location}
          responders={activeAlert.responders}
          followUser
          onLiveLocationChange={(coords) => {
            const current = useSOSStore.getState().activeAlert;
            if (!current) return;
            setActiveAlert({ ...current, location: coords });
          }}
        />
        <View
          className="absolute left-0 right-0 flex-row items-center justify-between px-4"
          style={{ top: insets.top + 8 }}>
          <GlassCard className="px-4 py-2">
            <View className="flex-row items-center gap-2">
              <View className="h-2 w-2 rounded-full bg-emergency" />
              <Text variant="caption" className="font-semibold text-emergency-glow">
                SOS Active
              </Text>
            </View>
          </GlassCard>
          <Pressable
            onPress={confirmCancel}
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
        <Text variant="body" muted className="mb-4">
          {enRouteCount} responder{enRouteCount === 1 ? '' : 's'} on the way
        </Text>

        <EmergencyDisclaimer compact className="mb-4" />

        {(locationWarning || locationPushFailed) && (
          <View className="mb-4 rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3">
            <Text variant="caption" className="text-warning">
              {locationPushFailed
                ? 'Failed to share your location with responders. Check your connection.'
                : locationWarning}
            </Text>
            {locationWarning ? (
              <Pressable onPress={() => void openAppSettings()} className="mt-2">
                <Text variant="caption" className="text-responder-light">
                  Open Settings
                </Text>
              </Pressable>
            ) : null}
          </View>
        )}

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
          <Button title="Cancel alert" variant="ghost" onPress={confirmCancel} />
        </View>
      </ScrollView>
    </View>
  );
}
