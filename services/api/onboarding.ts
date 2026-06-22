import { authenticatedRequest } from './client';
import { ApiError } from './client';

export interface OnboardingProgressPatch {
  contacts_synced?: boolean;
  trusted_contacts_count?: number;
  groups_created_count?: number;
  onboarding_complete?: boolean;
}

export async function patchOnboardingProgress(patch: OnboardingProgressPatch): Promise<void> {
  try {
    await authenticatedRequest('/auth/onboarding', {
      method: 'PATCH',
      body: JSON.stringify(patch),
    });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 405)) {
      return;
    }
    throw error;
  }
}
