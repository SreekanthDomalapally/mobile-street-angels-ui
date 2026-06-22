import { arePushNotificationsSupported, loadNotifications } from '@/services/notifications';
import { syncPushTokenWithServer } from '@/services/pushRegistration';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';

/** Re-sync Expo push token when it rotates or app returns to foreground. */
export function usePushTokenSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated || !arePushNotificationsSupported()) return;

    let pushSub: { remove: () => void } | undefined;

    void syncPushTokenWithServer().catch((error) => {
      console.warn('[push] Initial token sync failed:', error);
    });

    (async () => {
      const Notifications = await loadNotifications();
      if (!Notifications) return;

      pushSub = Notifications.addPushTokenListener(() => {
        void syncPushTokenWithServer().catch((error) => {
          console.warn('[push] Token refresh sync failed:', error);
        });
      });
    })();

    return () => {
      pushSub?.remove();
    };
  }, [isAuthenticated]);
}
