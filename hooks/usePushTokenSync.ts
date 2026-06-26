import { arePushNotificationsSupported, loadNotifications } from '@/services/notifications';
import { syncPushTokenWithServer } from '@/services/pushRegistration';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';
import { AppState } from 'react-native';

/** Re-sync Expo push token when it rotates or app returns to foreground. */
export function usePushTokenSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !arePushNotificationsSupported()) return;

    let pushSub: { remove: () => void } | undefined;
    let appStateSub: { remove: () => void } | undefined;

    const sync = () => {
      void syncPushTokenWithServer().catch((error) => {
        console.warn('[push] Token sync failed:', error);
      });
    };

    sync();

    appStateSub = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        sync();
      }
    });

    (async () => {
      const Notifications = await loadNotifications();
      if (!Notifications) return;

      pushSub = Notifications.addPushTokenListener(() => {
        sync();
      });
    })();

    return () => {
      pushSub?.remove();
      appStateSub?.remove();
    };
  }, [isAuthenticated]);
}
