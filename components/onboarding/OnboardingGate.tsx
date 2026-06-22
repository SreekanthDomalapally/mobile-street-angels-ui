import { Redirect, usePathname, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { LoadingState } from '@/components/common/LoadingState';
import { onboardingStepToHref } from '@/lib/onboarding';
import { refreshOnboardingFlags } from '@/services/onboardingState';
import { useAuthStore } from '@/stores/authStore';

/** Keeps tab routes behind the onboarding state machine. */
export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const flags = useAuthStore((s) => s.onboardingFlags);
  const [allowed, setAllowed] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setAllowed(false);
      setChecking(false);
      return;
    }

    let cancelled = false;
    setChecking(true);

    (async () => {
      const next = await refreshOnboardingFlags();
      if (cancelled) return;
      setAllowed(next.onboarding_complete || next.next_step === 'home');
      setChecking(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, pathname, flags?.onboarding_complete]);

  if (!isAuthenticated) {
    return <Redirect href="/(auth)/login" />;
  }

  if (checking) {
    return <LoadingState message="Checking your setup…" />;
  }

  if (!allowed && flags) {
    return <Redirect href={onboardingStepToHref(flags.next_step) as Href} />;
  }

  return children;
}
