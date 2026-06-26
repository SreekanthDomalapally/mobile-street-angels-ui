import { Platform } from 'react-native';
import { logSosEvent } from '@/lib/sosLog';
import { registerDeviceToken, unregisterDeviceToken } from '@/services/api/auth';
import {
  clearStoredPushToken,
  getStoredPushToken,
  setStoredPushToken,
} from '@/services/pushTokenStorage';
import { registerForPushNotifications, hasNotificationPermission } from '@/services/notifications';
import { getAccessToken } from '@/services/tokens';
import { useAuthStore } from '@/stores/authStore';

export async function syncPushTokenWithServer(): Promise<string | null> {
  const accessToken = await getAccessToken();
  if (!accessToken) return null;

  const granted = await hasNotificationPermission();
  if (!granted) {
    logSosEvent('PUSH_TOKEN_REGISTRATION_RESPONSE', {
      push_token_registered: false,
      error: 'notification_permission_denied',
    });
    return null;
  }

  const pushToken = await registerForPushNotifications();
  if (!pushToken) {
    logSosEvent('PUSH_TOKEN_REGISTRATION_RESPONSE', {
      push_token_registered: false,
      error: 'no_expo_push_token',
    });
    return null;
  }

  const previous = await getStoredPushToken();
  if (previous && previous !== pushToken) {
    await unregisterDeviceToken(accessToken, previous).catch(() => undefined);
  }

  try {
    await registerDeviceToken(accessToken, pushToken, Platform.OS);
    await setStoredPushToken(pushToken);
    useAuthStore.getState().setPermissionsGranted(true);
    logSosEvent('PUSH_TOKEN_REGISTERED_WITH_API', {
      token_preview: `${pushToken.slice(0, 28)}…`,
      push_token_registered: true,
    });
    logSosEvent('PUSH_TOKEN_REGISTRATION_RESPONSE', { push_token_registered: true });
    return pushToken;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    logSosEvent('PUSH_TOKEN_REGISTRATION_RESPONSE', {
      push_token_registered: false,
      error: message,
    });
    throw error;
  }
}

export async function unregisterPushFromServer(): Promise<void> {
  const accessToken = await getAccessToken();
  const pushToken = await getStoredPushToken();
  if (accessToken && pushToken) {
    await unregisterDeviceToken(accessToken, pushToken).catch(() => undefined);
  }
  await clearStoredPushToken();
}
