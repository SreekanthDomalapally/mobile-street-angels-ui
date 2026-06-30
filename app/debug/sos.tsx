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
import {
  fetchAlertDeliveryReport,
  fetchSosRoutingPreview,
  sendTestPushToGroup,
  sendTestPushToMe,
  type AlertDeliveryReport,
  type RoutingPreview,
} from '@/services/api/debug';
import { getApiOrigin } from '@/services/api/http';
import { getSOSLocation } from '@/services/location';
import {
  getPushEnvironmentDiagnostics,
  hasNotificationPermission,
  registerForPushNotificationsDetailed,
} from '@/services/notifications';
import { syncPushTokenWithServer } from '@/services/pushRegistration';
import { getStoredPushToken } from '@/services/pushTokenStorage';
import { getAccessToken } from '@/services/tokens';
import { alertSocket } from '@/services/websocket';
import { useAuthStore } from '@/stores/authStore';
import { areDebugToolsEnabled, useDebugStore } from '@/stores/debugStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { useSOSStore } from '@/stores/sosStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Alert, BackHandler, Pressable, ScrollView, View } from 'react-native';
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
  const debugUnlocked = useDebugStore((s) => s.unlocked);
  const debugToolsEnabled = areDebugToolsEnabled(debugUnlocked);
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
  const [pushTokenOnServer, setPushTokenOnServer] = useState(false);
  const [lastAction, setLastAction] = useState<string | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastRecipientCount, setLastRecipientCount] = useState<number | null>(null);
  const [lastNotificationStatus, setLastNotificationStatus] = useState<string | null>(null);
  const [routingPreview, setRoutingPreview] = useState<RoutingPreview | null>(null);
  const [deliveryReport, setDeliveryReport] = useState<AlertDeliveryReport | null>(null);
  const [wsStatus, setWsStatus] = useState<'idle' | 'connected' | 'error'>('idle');
  const [healthStatus, setHealthStatus] = useState<string | null>(null);

  const selectedGroupId = getSosGroupForEmergencyType(
    groups ?? [],
    emergencyType,
    defaultGroupId,
  );
  const recipientCount = countRecipients(groups, emergencyType, user?.id);
  const activeMembersCount = groups?.reduce((sum, g) => sum + (g.memberCount ?? g.members.length), 0) ?? 0;

  const pushEnv = getPushEnvironmentDiagnostics();

  useEffect(() => {
    void registerForPushNotificationsDetailed().then((result) => {
      setPushToken(result.ok ? result.token : null);
    });
    void getStoredPushToken().then((stored) => setPushTokenOnServer(Boolean(stored)));
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

  const goBack = useCallback(() => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)/profile');
    }
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      goBack();
      return true;
    });
    return () => subscription.remove();
  }, [goBack]);

  if (!debugToolsEnabled) {
    return (
      <View className="flex-1 items-center justify-center bg-charcoal-950 px-6">
        <Text variant="body" muted>
          SOS debug tools are locked on this build. Internal builds can unlock them from Profile
          by tapping the version label (when enabled at build time).
        </Text>
        <Button title="Go back" variant="secondary" className="mt-4" onPress={goBack} />
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
      <View className="mb-4 flex-row items-center gap-3">
        <Pressable
          onPress={goBack}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-xl bg-charcoal-800"
        >
          <Ionicons name="chevron-back" size={22} color="#a0a0a8" />
        </Pressable>
        <Text variant="title">SOS Debug</Text>
      </View>

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
          Push runtime: {pushEnv.runtime === 'native' ? 'native build (OK)' : pushEnv.runtime}
        </Text>
        <Text variant="caption" muted>
          Push supported: {pushEnv.pushSupported ? 'yes' : 'no'}
        </Text>
        <Text variant="caption" muted>
          EAS project ID: {pushEnv.easProjectId ? `${pushEnv.easProjectId.slice(0, 8)}…` : 'missing'}
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
          Push token registered: {pushTokenOnServer ? 'yes' : 'no'}
        </Text>
        <Text variant="caption" muted>
          Selected emergency type: {emergencyType}
        </Text>
        <Text variant="caption" muted>
          SOS group: {selectedGroupId ?? '—'}
        </Text>
        <Text variant="caption" muted>
          Groups: {groups?.length ?? 0} · Active members (all groups): {activeMembersCount}
        </Text>
        <Text variant="caption" muted>
          Est. recipients for type: {recipientCount}
        </Text>
        <Text variant="caption" muted>
          Last alert ID: {activeAlert?.id ?? '—'}
        </Text>
        <Text variant="caption" muted>
          Last recipient count: {lastRecipientCount ?? activeAlert?.recipientCount ?? '—'}
        </Text>
        <Text variant="caption" muted>
          Last notification status: {lastNotificationStatus ?? '—'}
        </Text>
        {routingPreview ? (
          <Text variant="caption" muted>
            Routing preview: {routingPreview.recipient_count} recipient(s)
          </Text>
        ) : null}
        {deliveryReport ? (
          <Text variant="caption" muted>
            Delivery: {deliveryReport.delivery_status?.delivered ?? 0} sent ·{' '}
            {deliveryReport.delivery_status?.failed ?? 0} failed ·{' '}
            {deliveryReport.recipients_without_tokens.length} no token
          </Text>
        ) : null}
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
          title="Sync push token to server"
          variant="secondary"
          onPress={() =>
            void runAction('Sync push token', async () => {
              const token = await syncPushTokenWithServer();
              setPushToken(token);
              setPushTokenOnServer(Boolean(token));
            })
          }
        />
        <Button
          title="Test push token registration"
          variant="secondary"
          onPress={() =>
            void runAction('Push token', async () => {
              const granted = await hasNotificationPermission();
              if (!granted) {
                throw new Error(
                  'Notification permission not granted. Enable in Settings → Apps → YouHoo Alert → Notifications.',
                );
              }
              const result = await registerForPushNotificationsDetailed();
              setPushToken(result.ok ? result.token : null);
              if (!result.ok) {
                throw new Error(result.message);
              }
            })
          }
        />
        <Button
          title="Test send notification to me"
          variant="secondary"
          onPress={() =>
            void runAction('Test push to me', async () => {
              await sendTestPushToMe();
              setLastNotificationStatus('test push sent');
            })
          }
        />
        <Button
          title="Test SOS routing preview"
          variant="secondary"
          onPress={() =>
            void runAction('Routing preview', async () => {
              if (!selectedGroupId) throw new Error('No SOS group selected');
              const preview = await fetchSosRoutingPreview(emergencyType, selectedGroupId);
              setRoutingPreview(preview);
              setLastRecipientCount(preview.recipient_count);
              setLastAction(
                `Routing: ${preview.recipient_count} recipients — ${preview.recipient_user_ids.join(', ')}`,
              );
            })
          }
        />
        <Button
          title="Test SOS notification to group"
          variant="secondary"
          onPress={() =>
            void runAction('Test group push', async () => {
              if (!selectedGroupId) throw new Error('No SOS group selected');
              await sendTestPushToGroup(emergencyType, selectedGroupId);
              setLastNotificationStatus('test SOS push sent to routed recipients');
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
                      setLastRecipientCount(alert.recipientCount ?? null);
                      setLastAction(`Alert created: ${alert.id}`);
                      try {
                        const report = await fetchAlertDeliveryReport(alert.id);
                        setDeliveryReport(report);
                        const delivered = report.delivery_status?.delivered ?? 0;
                        const failed = report.delivery_status?.failed ?? 0;
                        const pending = report.delivery_status?.pending ?? 0;
                        setLastNotificationStatus(
                          `queued: ${report.recipient_count} · delivered: ${delivered} · failed: ${failed} · pending: ${pending}`,
                        );
                      } catch {
                        setLastNotificationStatus('delivery report pending (refresh in a few seconds)');
                      }
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
