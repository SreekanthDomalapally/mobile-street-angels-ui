import { parseNotificationData } from '@/lib/notificationPayload';
import { SOS_ALERT_CHANNEL_ID } from '@/lib/notificationChannels';
import { logSosEvent } from '@/lib/sosLog';
import { useSettingsStore } from '@/stores/settingsStore';
import Constants from 'expo-constants';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

/** Push is native-only: unavailable in Expo Go (SDK 53+) and on web (requires VAPID). */
export function arePushNotificationsSupported(): boolean {
  return Platform.OS !== 'web' && !isRunningInExpoGo();
}

type NotificationsModule = typeof import('expo-notifications');

export type PushTokenFailureCode =
  | 'unsupported_runtime'
  | 'permission_denied'
  | 'missing_project_id'
  | 'token_failed';

export type PushTokenResult =
  | { ok: true; token: string }
  | { ok: false; code: PushTokenFailureCode; message: string };

let notificationHandlerConfigured = false;
let categoriesConfigured = false;

async function loadNotificationsModule(): Promise<NotificationsModule | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  return import('expo-notifications');
}

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (!arePushNotificationsSupported()) {
    return null;
  }

  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return null;
  }

  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async (notification) => {
        const data = notification.request.content.data as Record<string, unknown> | undefined;
        const parsed = parseNotificationData(data);
        const prefs = useSettingsStore.getState().notifications;
        const silentMode = useSettingsStore.getState().emergency.silentMode;

        const isEmergencyIncoming = parsed.kind === 'sos_alert' && !parsed.isOwnAlert;
        const shouldShow =
          isEmergencyIncoming ||
          (parsed.kind === 'responder_update' && prefs.responderUpdates) ||
          (parsed.kind === 'group_update' && prefs.groupUpdates) ||
          (parsed.kind === 'unknown' && prefs.emergencyAlerts);

        return {
          shouldShowAlert: shouldShow,
          shouldPlaySound: shouldShow && (isEmergencyIncoming || !silentMode),
          shouldSetBadge: shouldShow,
          shouldShowBanner: shouldShow,
          shouldShowList: shouldShow,
        };
      },
    });
    notificationHandlerConfigured = true;
  }

  if (!categoriesConfigured) {
    await configureNotificationCategories(Notifications);
    categoriesConfigured = true;
  }

  return Notifications;
}

async function configureNotificationCategories(Notifications: NotificationsModule) {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(SOS_ALERT_CHANNEL_ID, {
      name: 'SOS Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 200, 400],
      lightColor: '#c94a4a',
      bypassDnd: true,
      sound: 'default',
      enableVibrate: true,
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    // Legacy channel kept for older builds / local notifications.
    await Notifications.setNotificationChannelAsync('emergency', {
      name: 'Emergency SOS Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 400, 200, 400],
      lightColor: '#c94a4a',
      bypassDnd: true,
      sound: 'default',
      lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
    });

    await Notifications.setNotificationChannelAsync('responder', {
      name: 'Responder Updates',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('groups', {
      name: 'Group Updates',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  if (Platform.OS === 'ios') {
    await Notifications.setNotificationCategoryAsync('SOS_ALERT', [
      {
        identifier: 'VIEW_ALERT',
        buttonTitle: 'View alert',
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'RESPOND_HELP',
        buttonTitle: 'I can help',
        options: { opensAppToForeground: true },
      },
    ]);
  }
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Push token request timed out')), ms)
    ),
  ]);
}

function resolveEasProjectId(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_EAS_PROJECT_ID?.trim();
  if (fromEnv) return fromEnv;

  const extra = Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined;
  return extra?.eas?.projectId?.trim() || undefined;
}

export function getPushEnvironmentDiagnostics(): {
  pushSupported: boolean;
  runtime: 'native' | 'expo_go' | 'web';
  easProjectId: string | null;
} {
  if (Platform.OS === 'web') {
    return { pushSupported: false, runtime: 'web', easProjectId: resolveEasProjectId() ?? null };
  }
  if (isRunningInExpoGo()) {
    return { pushSupported: false, runtime: 'expo_go', easProjectId: resolveEasProjectId() ?? null };
  }
  return {
    pushSupported: true,
    runtime: 'native',
    easProjectId: resolveEasProjectId() ?? null,
  };
}

/** Returns true when the OS notification permission is granted. */
export async function hasNotificationPermission(): Promise<boolean> {
  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return false;
  }
  try {
    const { status } = await Notifications.getPermissionsAsync();
    logSosEvent('PUSH_PERMISSION_STATUS', { push_permission_status: status });
    return status === 'granted';
  } catch {
    return false;
  }
}

/** Request notification permission. Required for onboarding — separate from FCM token. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const Notifications = await loadNotificationsModule();
  if (!Notifications) {
    return false;
  }

  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync({
      android: {},
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
      },
    });
    return status === 'granted';
  } catch (error) {
    console.warn('[notifications] Permission request failed:', error);
    return false;
  }
}

export async function registerForPushNotifications(): Promise<string | null> {
  const result = await registerForPushNotificationsDetailed();
  return result.ok ? result.token : null;
}

export async function registerForPushNotificationsDetailed(): Promise<PushTokenResult> {
  if (!arePushNotificationsSupported()) {
    const runtime = Platform.OS === 'web' ? 'web' : 'Expo Go';
    return {
      ok: false,
      code: 'unsupported_runtime',
      message: `Push tokens are not available in ${runtime}. Install the Play Store / internal testing build.`,
    };
  }

  const Notifications = await loadNotifications();
  if (!Notifications) {
    return {
      ok: false,
      code: 'unsupported_runtime',
      message: 'Push notifications module unavailable on this device.',
    };
  }

  try {
    const granted = await ensureNotificationPermission();
    if (!granted) {
      return {
        ok: false,
        code: 'permission_denied',
        message: 'Notification permission is not granted. Enable it in Android Settings → Apps → YouHoo Alert → Notifications.',
      };
    }

    const projectId = resolveEasProjectId();
    if (!projectId) {
      return {
        ok: false,
        code: 'missing_project_id',
        message: 'EAS project ID is missing from this build. Rebuild with EXPO_PUBLIC_EAS_PROJECT_ID configured.',
      };
    }

    const token = await withTimeout(
      Notifications.getExpoPushTokenAsync({ projectId }),
      15000
    );
    logSosEvent('EXPO_PUSH_TOKEN_GENERATED', {
      token_preview: token.data ? `${token.data.slice(0, 28)}…` : undefined,
    });
    return { ok: true, token: token.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.warn('[notifications] Push token unavailable:', error);
    return {
      ok: false,
      code: 'token_failed',
      message:
        message.includes('Firebase') || message.includes('FCM')
          ? `${message} — upload FCM credentials in EAS and rebuild the Android app.`
          : message,
    };
  }
}

export async function scheduleEmergencyNotification(title: string, body: string) {
  const Notifications = await loadNotifications();
  if (!Notifications) return;

  const silentMode = useSettingsStore.getState().emergency.silentMode;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: silentMode ? undefined : 'default',
        priority: Notifications.AndroidNotificationPriority.MAX,
        categoryIdentifier: 'SOS_ALERT',
        data: { type: 'sos_alert', is_own_alert: true },
        ...(Platform.OS === 'android' ? { channelId: SOS_ALERT_CHANNEL_ID } : {}),
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('[notifications] Failed to schedule local notification:', error);
  }
}

export async function clearNotificationBadge(): Promise<void> {
  const Notifications = await loadNotifications();
  if (!Notifications) return;
  try {
    await Notifications.setBadgeCountAsync(0);
  } catch {
    // Badge clearing is best-effort.
  }
}

/** Create Android channels + notification handler as early as possible (before remote pushes arrive). */
export async function initializeNotificationInfrastructure(): Promise<void> {
  await loadNotifications();
}

export { loadNotifications };
