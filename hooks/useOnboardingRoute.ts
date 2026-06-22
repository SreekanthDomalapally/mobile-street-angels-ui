import { onboardingStepToHref } from '@/lib/onboarding';
import { refreshOnboardingFlags } from '@/services/onboardingState';
import { useAuthStore } from '@/stores/authStore';
import { useEffect, useState } from 'react';

export function useOnboardingRoute() {
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const flags = useAuthStore((s) => s.onboardingFlags);
  const [href, setHref] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isLoading) return;

    let cancelled = false;
    setRefreshing(true);

    (async () => {
      try {
        const nextFlags = isAuthenticated ? await refreshOnboardingFlags() : null;
        if (cancelled) return;

        if (!nextFlags) {
          const introDone = useAuthStore.getState().hasCompletedOnboarding;
          setHref(introDone ? '/(auth)/login' : '/(auth)/onboarding');
          return;
        }

        setHref(onboardingStepToHref(nextFlags.next_step));
      } catch {
        if (!cancelled && flags) {
          setHref(onboardingStepToHref(flags.next_step));
        }
      } finally {
        if (!cancelled) {
          setRefreshing(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isLoading, isAuthenticated, flags?.next_step]);

  return { href, isLoading: isLoading || refreshing };
}
