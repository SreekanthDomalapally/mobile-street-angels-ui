import { useEffect } from 'react';
import { Platform } from 'react-native';
import { registerDeviceToken } from '@/services/api/auth';
import { registerForPushNotifications } from '@/services/notifications';
import { getAccessToken } from '@/services/tokens';
import { restoreSession } from '@/services/auth';
import { refreshOnboardingFlags } from '@/services/onboardingState';
import { getAuthTokens } from '@/services/tokenStorage';
import { useAuthStore } from '@/stores/authStore';

async function registerPushIfPossible() {
  const pushToken = await registerForPushNotifications();
  if (!pushToken) return;
  const accessToken = await getAccessToken();
  if (!accessToken) return;
  await registerDeviceToken(accessToken, pushToken, Platform.OS);
}

/** Validates stored backend tokens and clears stale mock sessions on launch. */
export function useAuthBootstrap() {
  const setUser = useAuthStore((s) => s.setUser);
  const signOut = useAuthStore((s) => s.signOut);
  const setLoading = useAuthStore((s) => s.setLoading);

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
            await registerPushIfPossible();
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
  }, [setUser, signOut, setLoading]);
}
