import { getSelectedSosGroupId } from '@/components/home/SosGroupPicker';
import { evaluateSOSReadiness } from '@/lib/sosReadiness';
import { getOnboardingFlagsSnapshot } from '@/stores/authStore';
import { ApiError } from '@/services/api/client';
import { createSOSAlert, resolveSOSAlert } from '@/services/api/alerts';
import { getSOSLocation, hasLocationPermission } from '@/services/location';
import { isRetryableError } from '@/lib/retryableError';
import { enqueuePendingSOS } from '@/services/sosQueue';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Coordinates, EmergencyType, Group, SOSAlert } from '@/types';

export type TriggerSOSParams = {
  emergencyType: EmergencyType;
  groups: Group[];
  groupId?: string;
  location?: Coordinates;
};

export async function triggerSOS({
  emergencyType,
  groups,
  groupId: preferredGroupId,
  location: providedLocation,
}: TriggerSOSParams): Promise<SOSAlert> {
  const flags = getOnboardingFlagsSnapshot();
  if (!flags) {
    throw new ApiError('Complete setup before sending SOS.', 400, 'not_ready');
  }
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

  const location = providedLocation ?? (await getSOSLocation());
  if (!location) {
    throw new ApiError(
      'Location access is required to send an SOS alert.',
      400,
      'no_location'
    );
  }

  const settingsGroupId = useSettingsStore.getState().emergency.defaultSosGroupId;
  const groupId =
    preferredGroupId ??
    getSelectedSosGroupId(groups, settingsGroupId);
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
