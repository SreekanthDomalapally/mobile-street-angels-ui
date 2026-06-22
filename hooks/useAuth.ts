import { useEffect } from 'react';
import { restoreSession } from '@/services/auth';
import { refreshOnboardingFlags } from '@/services/onboardingState';
import { syncPushTokenWithServer } from '@/services/pushRegistration';
import { fetchNotificationPreferences } from '@/services/api/preferences';
import { getAuthTokens } from '@/services/tokenStorage';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';

/** Validates stored backend tokens and clears stale mock sessions on launch. */
export function useAuthBootstrap() {
  const setUser = useAuthStore((s) => s.setUser);
  const signOut = useAuthStore((s) => s.signOut);
  const setLoading = useAuthStore((s) => s.setLoading);
  const updateNotifications = useSettingsStore((s) => s.updateNotifications);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const tokens = await getAuthTokens();
        if (cancelled) return;

        if (tokens) {
          const user = await restoreSession();
          if (cancelled) return;
          if (user) {
            setUser(user);
            await refreshOnboardingFlags();
            const serverPrefs = await fetchNotificationPreferences().catch(() => null);
            if (serverPrefs) {
              updateNotifications(serverPrefs);
            }
            await syncPushTokenWithServer();
            return;
          }
        }

        signOut();
      } catch (error) {
        console.warn('[auth] Session bootstrap failed:', error);
        if (!cancelled) {
          signOut();
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setUser, signOut, setLoading, updateNotifications]);
}
