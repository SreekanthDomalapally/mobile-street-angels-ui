import { useEffect } from 'react';
import { restoreSession } from '@/services/auth';
import { getAuthTokens } from '@/services/tokenStorage';
import { useAuthStore } from '@/stores/authStore';

/** Validates stored backend tokens and clears stale mock sessions on launch. */
export function useAuthBootstrap() {
  const setUser = useAuthStore((s) => s.setUser);
  const signOut = useAuthStore((s) => s.signOut);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const tokens = await getAuthTokens();
      if (cancelled) return;

      if (tokens) {
        const user = await restoreSession();
        if (cancelled) return;
        if (user) {
          setUser(user);
          return;
        }
      }

      if (useAuthStore.getState().isAuthenticated) {
        signOut();
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [setUser, signOut]);
}
