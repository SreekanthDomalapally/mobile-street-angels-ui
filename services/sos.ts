import { ApiError } from '@/services/api/client';
import { createSOSAlert, resolveSOSAlert } from '@/services/api/alerts';
import { fetchGroups } from '@/services/api/groups';
import { getCurrentLocation } from '@/services/location';
import { isRetryableError } from '@/lib/retryableError';
import { enqueuePendingSOS } from '@/services/sosQueue';
import type { EmergencyType, SOSAlert } from '@/types';

export async function triggerSOS(emergencyType: EmergencyType): Promise<SOSAlert> {
  const groups = await fetchGroups();
  if (!groups.length) {
    throw new ApiError(
      'Create a trusted group before sending an SOS alert.',
      400,
      'no_group'
    );
  }

  const location = await getCurrentLocation();
  if (!location) {
    throw new ApiError(
      'Location access is required to send an SOS alert.',
      400,
      'no_location'
    );
  }

  const groupId = groups[0].id;

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
