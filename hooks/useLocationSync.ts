import { syncMyLocation } from '@/services/locationSync';
import { useAuthStore } from '@/stores/authStore';
import { useEffect } from 'react';
import { AppState } from 'react-native';

/** Refresh last-known location on login and whenever the app returns to foreground. */
export function useLocationSync() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;

    void syncMyLocation(true);

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        void syncMyLocation();
      }
    });

    return () => subscription.remove();
  }, [isAuthenticated]);
}
