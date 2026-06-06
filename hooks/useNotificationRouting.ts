import { arePushNotificationsSupported } from '@/services/notifications';
import { router } from 'expo-router';
import { useEffect } from 'react';

function routeFromNotificationData(data: Record<string, unknown> | undefined) {
  const alertId = data?.alert_id ?? data?.alertId;
  if (typeof alertId === 'string' && alertId.length > 0) {
    router.push(`/alert/${alertId}`);
  }
}

export function useNotificationRouting() {
  useEffect(() => {
    if (!arePushNotificationsSupported()) return;

    let responseSub: { remove: () => void } | undefined;

    (async () => {
      const Notifications = await import('expo-notifications');

      const last = await Notifications.getLastNotificationResponseAsync();
      if (last) {
        routeFromNotificationData(last.notification.request.content.data as Record<string, unknown>);
      }

      responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
        routeFromNotificationData(
          response.notification.request.content.data as Record<string, unknown>
        );
      });
    })();

    return () => {
      responseSub?.remove();
    };
  }, []);
}
