import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';

/** Push is native-only: unavailable in Expo Go (SDK 53+) and on web (requires VAPID). */
export function arePushNotificationsSupported(): boolean {
  return Platform.OS !== 'web' && !isRunningInExpoGo();
}

type NotificationsModule = typeof import('expo-notifications');

let notificationHandlerConfigured = false;

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (!arePushNotificationsSupported()) {
    return null;
  }

  const Notifications = await import('expo-notifications');

  if (!notificationHandlerConfigured) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    notificationHandlerConfigured = true;
  }

  return Notifications;
}

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Push token request timed out')), ms)
    ),
  ]);
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
    const { status: existing } = await Notifications.getPermissionsAsync();
    let finalStatus = existing;

    if (existing !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('emergency', {
        name: 'Emergency Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#c94a4a',
        bypassDnd: true,
      });
    }

    const projectId = process.env.EXPO_PUBLIC_EAS_PROJECT_ID;
    if (!projectId) {
      console.warn('[notifications] EXPO_PUBLIC_EAS_PROJECT_ID missing; skipping push token.');
      return null;
    }

    const token = await withTimeout(
      Notifications.getExpoPushTokenAsync({ projectId }),
      15000
    );
    return token.data;
  } catch (error) {
    // FCM may not be configured yet — permission can still be granted; don't block onboarding.
    console.warn('[notifications] Push token unavailable:', error);
    return null;
  }
}

export async function scheduleEmergencyNotification(title: string, body: string) {
  const Notifications = await loadNotifications();
  if (!Notifications) return;

  try {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.MAX,
        categoryIdentifier: 'emergency',
      },
      trigger: null,
    });
  } catch (error) {
    console.warn('[notifications] Failed to schedule local notification:', error);
  }
}
