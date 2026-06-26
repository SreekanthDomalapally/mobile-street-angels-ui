import {
  countUsersForEmergencyType,
  getSosGroupForEmergencyType,
} from '@/lib/groupLabels';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useGroups } from '@/hooks/useGroups';
import { useSOSReadiness } from '@/hooks/useSOSReadiness';
import { logSosEvent } from '@/lib/sosLog';
import { createSOSAlert } from '@/services/api/alerts';
import { getApiOrigin } from '@/services/api/http';
import { getSOSLocation } from '@/services/location';
import {
  hasNotificationPermission,
  registerForPushNotifications,
} from '@/services/notifications';
import { getAccessToken } from '@/services/tokens';
import { alertSocket } from '@/services/websocket';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSOSStore } from '@/stores/sosStore';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function countRecipients(
  groups: ReturnType<typeof useGroups>['data'],
  emergencyType: ReturnType<typeof useSOSStore.getState>['emergencyType'],
  userId?: string,
): number {
  return countUsersForEmergencyType(groups, emergencyType, userId);
}

export default function SosDebugScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const flags = useAuthStore((s) => s.onboardingFlags);
  const { readiness, locationGranted, notificationsGranted, refreshPermissions } =
    useSOSReadiness();
  const { data: groups } = useGroups();
  const defaultGroupId = useSettingsStore((s) => s.emergency.defaultSosGroupId);
  const emergencyType = useSOSStore((s) => s.emergencyType);
  const activeAlert = useSOSStore((s) => s.activeAlert);
  const activationError = useSOSStore((s) => s.activationError);

  const [pushToken, setPushToken] = useState<string | null>(null);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [healthStatus, setHealthStatus] = useState<string | null>(null);

  const selectedGroupId = getSosGroupForEmergencyType(
    groups ?? [],
    emergencyType,
    defaultGroupId,
  );
  const recipientCount = countRecipients(groups, emergencyType, user?.id);

  useEffect(() => {
    void registerForPushNotifications().then(setPushToken).catch(() => setPushToken(null));
  }, []);

  const runAction = useCallback(async (label: string, fn: () => Promise<void>) => {
    setLastAction(label);
    setLastError(null);
    try {
      await fn();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLastError(message);
      logSosEvent('NOTIFICATION_FAILED', { error: message });
    }
  }, []);

  if (!__DEV__) {
    return (
      <View className="flex-1 items-center justify-center bg-charcoal-950 px-6">
        <Text variant="body" muted>
          SOS debug tools are only available in development builds.
        </Text>
        <Button title="Go back" variant="secondary" className="mt-4" onPress={() => router.back()} />
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-charcoal-950"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 20,
      }}>
      <Text variant="title" className="mb-4">
        SOS Debug
      </Text>

      <View className="mb-4 gap-2 rounded-2xl border border-glass-border bg-charcoal-900 p-4">
        <Text variant="label">Status</Text>
        <Text variant="caption" muted>
          User ID: {user?.id ?? '—'}
        </Text>
        <Text variant="caption" muted>
          Phone verified: {flags?.is_phone_verified ? 'yes' : 'no'}
        </Text>
        <Text variant="caption" muted>
          Readiness: {readiness.ready ? 'ready' : readiness.reason ?? 'not ready'}
        </Text>
        <Text variant="caption" muted>
          Location permission: {locationGranted ? 'granted' : 'denied'}
        </Text>
        <Text variant="caption" muted>
          Notification permission: {notificationsGranted ? 'granted' : 'denied'}
        </Text>
        <Text variant="caption" muted>
          Push token: {pushToken ? `${pushToken.slice(0, 24)}…` : 'none'}
        </Text>
        <Text variant="caption" muted>
          Groups: {groups?.length ?? 0} · Active recipients (est.): {recipientCount}
        </Text>
        <Text variant="caption" muted>
          Last alert ID: {activeAlert?.id ?? '—'}
        </Text>
        <Text variant="caption" muted>
          Store error: {activationError ?? '—'}
        </Text>
        <Text variant="caption" muted>
          WebSocket: {wsStatus}
        </Text>
        <Text variant="caption" muted>
          Notification health: {healthStatus ?? '—'}
        </Text>
        <Text variant="caption" muted>
          Last action: {lastAction ?? '—'}
        </Text>
        {lastError ? (
          <Text variant="caption" className="text-emergency">
            {lastError}
          </Text>
        ) : null}
      </View>

      <View className="gap-3">
        <Button title="Refresh permissions" variant="secondary" onPress={refreshPermissions} />
        <Button
          title="Test location"
          variant="secondary"
          onPress={() =>
            void runAction('Test location', async () => {
              const coords = await getSOSLocation();
              if (!coords) throw new Error('No location available');
              setLastAction(`Location: ${coords.latitude.toFixed(5)}, ${coords.longitude.toFixed(5)}`);
            })
          }
        />
        <Button
          title="Test push token registration"
          variant="secondary"
          onPress={() =>
            void runAction('Push token', async () => {
              const granted = await hasNotificationPermission();
              if (!granted) throw new Error('Notification permission not granted');
              const token = await registerForPushNotifications();
              setPushToken(token);
              if (!token) throw new Error('No push token returned');
            })
          }
        />
        <Button
          title="Test notification health"
          variant="secondary"
          onPress={() =>
            void runAction('Notification health', async () => {
              const token = await getAccessToken();
              const origin = getApiOrigin();
              const res = await fetch(`${origin}/health/notifications`, {
                headers: token ? { Authorization: `Bearer ${token}` } : {},
              });
              const body = await res.text();
              setHealthStatus(`${res.status}: ${body.slice(0, 120)}`);
            })
          }
        />
        <Button
          title="Test create alert (confirm)"
          variant="emergency"
          onPress={() => {
            Alert.alert(
              'Create test SOS?',
              'This sends a real alert to your group. Only use on staging.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Send',
                  style: 'destructive',
                  onPress: () =>
                    void runAction('Create alert', async () => {
                      if (!selectedGroupId) throw new Error('No SOS group selected');
                      const location = await getSOSLocation();
                      if (!location) throw new Error('Location unavailable');
                      const alert = await createSOSAlert({
                        groupId: selectedGroupId,
                        emergencyType,
                        location,
                        message: 'SOS debug test',
                      });
                      useSOSStore.getState().setActiveAlert(alert);
                      setLastAction(`Alert created: ${alert.id}`);
                    }),
                },
              ],
            );
          }}
        />
        <Button
          title="Test WebSocket"
          variant="secondary"
          onPress={() =>
            void runAction('WebSocket', async () => {
              const alertId = activeAlert?.id;
              if (!alertId || alertId === 'pending') {
                throw new Error('No active alert ID — create an alert first');
              }
              const token = await getAccessToken();
              if (!token) throw new Error('Not authenticated');
              setWsStatus('idle');
              alertSocket.connect(alertId, token);
              alertSocket.onStatusChange(() => setWsStatus('connected'));
              setWsStatus('connected');
            })
          }
        />
      </View>
    </ScrollView>
  );
}
