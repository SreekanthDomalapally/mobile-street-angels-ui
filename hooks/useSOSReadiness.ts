import { evaluateSOSReadiness } from '@/lib/sosReadiness';
import { hasLocationPermission } from '@/services/location';
import { useAuthStore } from '@/stores/authStore';
import { useGroups } from '@/hooks/useGroups';
import { useEffect, useMemo, useState } from 'react';
import type { SOSReadiness } from '@/lib/sosReadiness';

export function useSOSReadiness() {
  const flags = useAuthStore((s) => s.onboardingFlags);
  const { data: groups } = useGroups();
  const [locationGranted, setLocationGranted] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void hasLocationPermission().then((granted) => {
      if (!cancelled) setLocationGranted(granted);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const readiness = useMemo<SOSReadiness>(() => {
    if (!flags) {
      return {
        ready: false,
        reason: 'Checking readiness…',
        ctaHref: null,
        ctaLabel: null,
      };
    }
    return evaluateSOSReadiness(flags, groups, locationGranted);
  }, [flags, groups, locationGranted]);

  return { readiness, locationGranted, flags };
}
