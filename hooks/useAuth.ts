import { useEffect } from 'react';
import { restoreSession } from '@/services/auth';
import { refreshOnboardingFlags } from '@/services/onboardingState';
import { syncPushTokenWithServer } from '@/services/pushRegistration';
import { fetchNotificationPreferences } from '@/services/api/preferences';
import { getAuthTokens } from '@/services/tokenStorage';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';

const BOOTSTRAP_TIMEOUT_MS = 20_000;

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out`)), ms)
    ),
  ]);
}

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
          const user = await withTimeout(restoreSession(), BOOTSTRAP_TIMEOUT_MS, 'Session restore');
          if (cancelled) return;
          if (user) {
            setUser(user);
            await withTimeout(
              refreshOnboardingFlags(),
              BOOTSTRAP_TIMEOUT_MS,
              'Onboarding refresh'
            ).catch((error) => {
              console.warn('[auth] Onboarding refresh during bootstrap failed:', error);
            });

            const serverPrefs = await fetchNotificationPreferences().catch(() => null);
            if (serverPrefs) {
              updateNotifications(serverPrefs);
            }

            // Never block launch on push registration (emulator often has no FCM token).
            void syncPushTokenWithServer().catch((error) => {
              console.warn('[auth] Push token sync skipped:', error);
            });
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
