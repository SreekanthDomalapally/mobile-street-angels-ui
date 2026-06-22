import { getOnboardingFlagsSnapshot } from '@/stores/authStore';
import { onboardingStepToHref } from '@/lib/onboarding';
import { refreshOnboardingFlags } from '@/services/onboardingState';
import { useAuthStore } from '@/stores/authStore';
import { useEffect, useState } from 'react';

const ROUTE_RESOLVE_TIMEOUT_MS = 25_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Onboarding route resolve timed out')), ms)
    ),
  ]);
}

function fallbackHref(): string {
  const state = useAuthStore.getState();
  if (!state.isAuthenticated) {
    return state.hasCompletedOnboarding ? '/(auth)/login' : '/(auth)/onboarding';
  }
  const snapshot = getOnboardingFlagsSnapshot();
  if (snapshot) {
    return onboardingStepToHref(snapshot.next_step);
  }
  return '/(auth)/login';
}

/** Wait for persisted onboarding flags (intro/permissions) before routing guests. */
function useAuthStoreHydrated(): boolean {
  const [hydrated, setHydrated] = useState(() => useAuthStore.persist.hasHydrated());

  useEffect(() => {
    if (useAuthStore.persist.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return useAuthStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}

export function useOnboardingRoute() {
  const hydrated = useAuthStoreHydrated();
  const isLoading = useAuthStore((s) => s.isLoading);
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [href, setHref] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!hydrated || isLoading) return;

    let cancelled = false;
    setRefreshing(true);

    (async () => {
      try {
        if (!isAuthenticated) {
          const introDone = useAuthStore.getState().hasCompletedOnboarding;
          if (!cancelled) {
            setHref(introDone ? '/(auth)/login' : '/(auth)/onboarding');
          }
          return;
        }

        const nextFlags = await withTimeout(refreshOnboardingFlags(), ROUTE_RESOLVE_TIMEOUT_MS);
        if (!cancelled) {
          setHref(onboardingStepToHref(nextFlags.next_step));
        }
      } catch (error) {
        console.warn('[onboarding] Route resolve failed:', error);
        if (!cancelled) {
          setHref(fallbackHref());
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
  }, [hydrated, isLoading, isAuthenticated]);

  return { href, isLoading: !hydrated || isLoading || refreshing };
}
