import { useRouter, type Href } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { LoadingState } from '@/components/common/LoadingState';
import { onboardingStepToHref } from '@/lib/onboarding';
import { refreshOnboardingFlags } from '@/services/onboardingState';
import { useAuthStore } from '@/stores/authStore';
import type { OnboardingFlags } from '@/types';

function isTabsAllowed(flags: OnboardingFlags): boolean {
  return flags.onboarding_complete || flags.next_step === 'home';
}

/** Keeps tab routes behind the onboarding state machine. */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const flags = useAuthStore((s) => s.onboardingFlags);
  const [checking, setChecking] = useState(() => !flags);
  const lastRedirectRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setChecking(false);
      return;
    }

    let cancelled = false;
    setChecking((prev) => prev || !useAuthStore.getState().onboardingFlags);

    (async () => {
      try {
        await refreshOnboardingFlags();
      } catch (error) {
        console.warn('[onboarding] Gate check failed:', error);
      } finally {
        if (!cancelled) {
          setChecking(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated) {
      const target = '/(auth)/login';
      if (lastRedirectRef.current === target) return;
      lastRedirectRef.current = target;
      router.replace(target as Href);
      return;
    }

    if (checking && !flags) return;

    if (!flags || isTabsAllowed(flags)) {
      lastRedirectRef.current = null;
      return;
    }

    const target = onboardingStepToHref(flags.next_step);
    if (lastRedirectRef.current === target) return;
    lastRedirectRef.current = target;
    router.replace(target as Href);
  }, [checking, flags, isAuthenticated, router]);

  if (!isAuthenticated) {
    return <LoadingState message="Signing in…" />;
  }

  if (checking && !flags) {
    return <LoadingState message="Checking your setup…" />;
  }

  if (flags && !isTabsAllowed(flags)) {
    return <LoadingState message="Checking your setup…" />;
  }

  return children;
}
