import { evaluateSOSReadiness } from '@/lib/sosReadiness';
import { hasLocationPermission } from '@/services/location';
import { hasNotificationPermission } from '@/services/notifications';
import { useAuthStore } from '@/stores/authStore';
import { useGroups } from '@/hooks/useGroups';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import type { SOSReadiness } from '@/lib/sosReadiness';

export function useSOSReadiness() {
  const flags = useAuthStore((s) => s.onboardingFlags);
  const { data: groups } = useGroups();
  const [locationGranted, setLocationGranted] = useState(false);
  const [notificationsGranted, setNotificationsGranted] = useState(true);

  const refreshPermissions = useCallback(() => {
    void hasLocationPermission().then(setLocationGranted);
    void hasNotificationPermission().then(setNotificationsGranted);
  }, []);

  useFocusEffect(
    useCallback(() => {
      refreshPermissions();
    }, [refreshPermissions]),
  );

  const readiness = useMemo<SOSReadiness>(() => {
    if (!flags) {
      return {
        ready: false,
        reason: 'Checking readiness…',
        ctaHref: null,
        ctaLabel: null,
      };
    }
    return evaluateSOSReadiness(flags, groups, locationGranted, notificationsGranted);
  }, [flags, groups, locationGranted, notificationsGranted]);

  return { readiness, locationGranted, notificationsGranted, flags, refreshPermissions };
}
