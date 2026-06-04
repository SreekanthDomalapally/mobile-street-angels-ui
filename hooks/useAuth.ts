import { useEffect } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { subscribeToAuth } from '@/services/firebase';

export function useAuthListener() {
  const setUser = useAuthStore((s) => s.setUser);

  useEffect(() => {
    try {
      return subscribeToAuth(setUser);
    } catch {
      return undefined;
    }
  }, [setUser]);
}
