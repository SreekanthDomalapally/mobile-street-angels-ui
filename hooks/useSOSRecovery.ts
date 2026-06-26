import { useEffect } from 'react';
import { router } from 'expo-router';
import { findActiveAlert } from '@/services/sosRecovery';
import { useAuthStore } from '@/stores/authStore';
import { useSOSStore } from '@/stores/sosStore';

/**
 * On launch (or after auth restore), recover an in-progress SOS from the API
 * and return the user to the active alert screen.
 */
export function useSOSRecovery() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const isLoading = useAuthStore((s) => s.isLoading);
  const userId = useAuthStore((s) => s.user?.id);
  const activeAlert = useSOSStore((s) => s.activeAlert);
  const setActiveAlert = useSOSStore((s) => s.setActiveAlert);

  useEffect(() => {
    if (!isAuthenticated || isLoading || activeAlert || !userId) return;

    let cancelled = false;

    (async () => {
      try {
        const alert = await findActiveAlert(userId);
        if (cancelled || !alert) return;
        setActiveAlert(alert);
        router.replace('/sos/active');
      } catch (error) {
        console.warn('[sos] Recovery failed:', error);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, isLoading, activeAlert, setActiveAlert, userId]);
}
