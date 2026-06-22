import { getSelectedSosGroupId } from '@/components/home/SosGroupPicker';
import { evaluateSOSReadiness } from '@/lib/sosReadiness';
import { refreshOnboardingFlags } from '@/services/onboardingState';
import { hasLocationPermission } from '@/services/location';
import { getOnboardingFlagsSnapshot } from '@/stores/authStore';
import { ApiError } from '@/services/api/client';
import { createSOSAlert, resolveSOSAlert } from '@/services/api/alerts';
import { fetchGroups } from '@/services/api/groups';
import { getCurrentLocation } from '@/services/location';
import { isRetryableError } from '@/lib/retryableError';
import { enqueuePendingSOS } from '@/services/sosQueue';
import { useSettingsStore } from '@/stores/settingsStore';
import type { EmergencyType, SOSAlert } from '@/types';

export async function triggerSOS(emergencyType: EmergencyType): Promise<SOSAlert> {
  const flags = getOnboardingFlagsSnapshot() ?? (await refreshOnboardingFlags());
  const groups = await fetchGroups();
  const locationGranted = await hasLocationPermission();
  const readiness = evaluateSOSReadiness(flags, groups, locationGranted);

  if (!readiness.ready) {
    throw new ApiError(readiness.reason ?? 'Complete setup before sending SOS.', 400, 'not_ready');
  }

  if (!groups.length) {
    throw new ApiError(
      'Create a trusted group before sending an SOS alert.',
      400,
      'no_group'
    );
  }

  const location = await getCurrentLocation({ highAccuracy: true });
  if (!location) {
    throw new ApiError(
      'Location access is required to send an SOS alert.',
      400,
      'no_location'
    );
  }

  const preferredGroupId = useSettingsStore.getState().emergency.defaultSosGroupId;
  const groupId = getSelectedSosGroupId(groups, preferredGroupId);
  if (!groupId) {
    throw new ApiError('Select a group for SOS alerts.', 400, 'no_group');
  }

  try {
    return await createSOSAlert({
      groupId,
      emergencyType,
      location,
    });
  } catch (error) {
    if (isRetryableError(error)) {
      await enqueuePendingSOS({
        groupId,
        emergencyType,
        location,
        createdAt: new Date().toISOString(),
      });
      throw new ApiError(
        'No connection. Your alert is queued and will send when you are back online.',
        503,
        'queued'
      );
    }
    throw error;
  }
}

export async function endSOSAlert(alertId: string): Promise<SOSAlert> {
  return resolveSOSAlert(alertId);
}
