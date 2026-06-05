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

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;

  if (existing !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('emergency', {
      name: 'Emergency Alerts',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#c94a4a',
      bypassDnd: true,
    });
  }

  const token = await Notifications.getExpoPushTokenAsync({
    projectId: process.env.EXPO_PUBLIC_EAS_PROJECT_ID,
  });
  return token.data;
}

export async function scheduleEmergencyNotification(title: string, body: string) {
  const Notifications = await loadNotifications();
  if (!Notifications) return;

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
}
