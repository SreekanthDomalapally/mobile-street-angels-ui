import { parseNotificationData } from '@/lib/notificationPayload';
import { useSettingsStore } from '@/stores/settingsStore';
import Constants from 'expo-constants';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

/** Push is native-only: unavailable in Expo Go (SDK 53+) and on web (requires VAPID). */
export function arePushNotificationsSupported(): boolean {
  return Platform.OS !== 'web' && !isRunningInExpoGo();
}

type NotificationsModule = typeof import('expo-notifications');

let notificationHandlerConfigured = false;
let categoriesConfigured = false;

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (!arePushNotificationsSupported()) {
    return null;
  }

  const Notifications = await import('expo-notifications');

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
          shouldPlaySound: shouldShow && !silentMode,
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

/** Returns true when notification permission is granted (or unavailable in dev). */
export async function hasNotificationPermission(): Promise<boolean> {
  const Notifications = await loadNotifications();
  if (!Notifications) {
    return __DEV__;
  }
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}

/** Request notification permission. Required for onboarding — separate from FCM token. */
export async function ensureNotificationPermission(): Promise<boolean> {
  const Notifications = await loadNotifications();
  if (!Notifications) {
    // Expo Go / web: treat as granted so dev flow can continue.
    return __DEV__;
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
  const Notifications = await loadNotifications();
  if (!Notifications) {
    if (__DEV__) {
      console.info(
        '[notifications] Skipped on web / Expo Go. Use a development or store build on a device for push tokens.'
      );
    }
    return null;
  }

  try {
    const granted = await ensureNotificationPermission();
    if (!granted) {
      return null;
    }

    const projectId = resolveEasProjectId();
    if (!projectId) {
      console.warn('[notifications] EAS project ID missing; skipping push token.');
      return null;
    }

    const token = await withTimeout(
      Notifications.getExpoPushTokenAsync({ projectId }),
      15000
    );
    return token.data;
  } catch (error) {
    console.warn('[notifications] Push token unavailable:', error);
    return null;
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
        ...(Platform.OS === 'android' ? { channelId: 'emergency' } : {}),
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

export { loadNotifications };
