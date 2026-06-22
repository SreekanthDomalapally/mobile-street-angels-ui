import {
  parseNotificationData,
  type ParsedNotificationPayload,
} from '@/lib/notificationPayload';
import { respondToAlert } from '@/services/api/alerts';
import {
  arePushNotificationsSupported,
  clearNotificationBadge,
  loadNotifications,
} from '@/services/notifications';
import { useAuthStore } from '@/stores/authStore';
import { useSOSStore } from '@/stores/sosStore';
import { useSettingsStore } from '@/stores/settingsStore';
import { router, type Href } from 'expo-router';
import { useEffect } from 'react';

function shouldHandleNotification(parsed: ParsedNotificationPayload): boolean {
  if (parsed.kind === 'sos_alert' && !parsed.isOwnAlert) {
    return true;
  }

  const prefs = useSettingsStore.getState().notifications;
  if (parsed.kind === 'responder_update') return prefs.responderUpdates;
  if (parsed.kind === 'group_update' || parsed.kind === 'trip_watch' || parsed.kind === 'check_in') {
    return prefs.groupUpdates;
  }
  return prefs.emergencyAlerts;
}

async function handleNotificationAction(
  actionId: string | undefined,
  parsed: ParsedNotificationPayload
) {
  if (actionId === 'RESPOND_HELP' && parsed.alertId) {
    try {
      await respondToAlert(parsed.alertId, 'i_can_help');
    } catch (error) {
      console.warn('[notifications] Quick respond failed:', error);
    }
  }
}

function navigateForNotification(parsed: ParsedNotificationPayload, replace = false) {
  if (!shouldHandleNotification(parsed)) return;

  const navigate = replace ? router.replace.bind(router) : router.push.bind(router);

  if (parsed.isOwnAlert || parsed.kind === 'responder_update') {
    const { activeAlert } = useSOSStore.getState();
    if (activeAlert || parsed.isOwnAlert) {
      navigate('/sos/active' as Href);
      return;
    }
  }

  if (parsed.tripId) {
    navigate(`/trip/${parsed.tripId}` as Href);
    return;
  }

  if (parsed.alertId) {
    navigate(`/alert/${parsed.alertId}` as Href);
    return;
  }

  if (parsed.kind === 'group_update') {
    navigate('/(tabs)/groups' as Href);
  }
}

function routeFromResponse(
  data: Record<string, unknown> | undefined,
  actionIdentifier?: string,
  replace = false
) {
  const parsed = parseNotificationData(data);
  void handleNotificationAction(actionIdentifier, parsed);
  navigateForNotification(parsed, replace);
  void clearNotificationBadge();
}

export function useNotificationRouting() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!arePushNotificationsSupported() || !isAuthenticated) return;

    let receivedSub: { remove: () => void } | undefined;
    let responseSub: { remove: () => void } | undefined;

    (async () => {
      const Notifications = await loadNotifications();
      if (!Notifications) return;

      const last = await Notifications.getLastNotificationResponseAsync();
      if (last) {
        routeFromResponse(
          last.notification.request.content.data as Record<string, unknown>,
          last.actionIdentifier,
          true
        );
      }

      receivedSub = Notifications.addNotificationReceivedListener((notification) => {
        const data = notification.request.content.data as Record<string, unknown>;
        const parsed = parseNotificationData(data);
        if (!shouldHandleNotification(parsed)) return;

        if (parsed.kind === 'sos_alert' && !parsed.isOwnAlert && parsed.alertId) {
          navigateForNotification(parsed, false);
        }
      });

      responseSub = Notifications.addNotificationResponseReceivedListener((response) => {
        routeFromResponse(
          response.notification.request.content.data as Record<string, unknown>,
          response.actionIdentifier,
          false
        );
      });
    })();

    return () => {
      receivedSub?.remove();
      responseSub?.remove();
    };
  }, [isAuthenticated]);
}
