import { Platform } from 'react-native';
import { registerDeviceToken, unregisterDeviceToken } from '@/services/api/auth';
import {
  clearStoredPushToken,
  getStoredPushToken,
  setStoredPushToken,
} from '@/services/pushTokenStorage';
import { registerForPushNotifications } from '@/services/notifications';
import { getAccessToken } from '@/services/tokens';

export async function syncPushTokenWithServer(): Promise<string | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  const pushToken = await registerForPushNotifications();
  if (!pushToken) return null;

  const previous = await getStoredPushToken();
  if (previous && previous !== pushToken) {
    await unregisterDeviceToken(accessToken, previous).catch(() => undefined);
  }

  await registerDeviceToken(accessToken, pushToken, Platform.OS);
  await setStoredPushToken(pushToken);
  return pushToken;
}

export async function unregisterPushFromServer(): Promise<void> {
  const accessToken = await getAccessToken();
  const pushToken = await getStoredPushToken();
  if (accessToken && pushToken) {
    await unregisterDeviceToken(accessToken, pushToken).catch(() => undefined);
  }
  await clearStoredPushToken();
}
