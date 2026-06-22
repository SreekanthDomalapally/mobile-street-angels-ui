import { evaluateSOSReadiness } from '@/lib/sosReadiness';
import { refreshOnboardingFlags } from '@/services/onboardingState';
import { requestLocationPermission, hasLocationPermission } from '@/services/location';
import { useAuthStore } from '@/stores/authStore';
import { useGroups } from '@/hooks/useGroups';
import { useEffect, useState } from 'react';
import type { SOSReadiness } from '@/lib/sosReadiness';

export function useSOSReadiness() {
  const flags = useAuthStore((s) => s.onboardingFlags);
  const { data: groups } = useGroups();
  const [locationGranted, setLocationGranted] = useState(false);
  const [readiness, setReadiness] = useState<SOSReadiness>({
    ready: false,
    reason: 'Checking readiness…',
    ctaHref: null,
    ctaLabel: null,
  });

  useEffect(() => {
    let cancelled = false;

    (async () => {
      const nextFlags = flags ?? (await refreshOnboardingFlags());
      const granted = await hasLocationPermission();
      if (cancelled) return;
      setLocationGranted(granted);
      setReadiness(evaluateSOSReadiness(nextFlags, groups, granted));
    })();

    return () => {
      cancelled = true;
    };
  }, [flags, groups]);

  return { readiness, locationGranted, flags };
}
