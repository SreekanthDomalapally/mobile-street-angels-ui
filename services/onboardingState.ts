import { computeOnboardingFlags } from '@/lib/onboarding';
import { countAcceptedTrustedContacts } from '@/services/api/trustedContacts';
import { fetchGroups } from '@/services/api/groups';
import { fetchOnboardingStatus } from '@/services/api/auth';
import { patchOnboardingProgress } from '@/services/api/onboarding';
import {
  getContactsSynced,
  getTrustedMinimumMet,
  setContactsSynced,
  setTrustedMinimumMet,
} from '@/services/onboardingProgress';
import { getAccessToken } from '@/services/tokens';
import { useAuthStore } from '@/stores/authStore';
import type { OnboardingFlags } from '@/types';

export async function refreshOnboardingFlags(): Promise<OnboardingFlags> {
  const state = useAuthStore.getState();
  const user = state.user;

  let apiOnboarding = state.onboarding;
  const token = await getAccessToken();
  if (token) {
    try {
      apiOnboarding = await fetchOnboardingStatus(token);
      state.setOnboarding(apiOnboarding);
    } catch {
      // Keep cached onboarding flags when offline.
    }
  }

  const [contactsSyncedLocal, trustedMinMet, groups, trustedCount] = await Promise.all([
    getContactsSynced(),
    getTrustedMinimumMet(),
    fetchGroups().catch(() => []),
    countAcceptedTrustedContacts().catch(() => 0),
  ]);

  const contactsSynced =
    apiOnboarding?.contacts_synced ?? contactsSyncedLocal ?? !apiOnboarding?.needs_contacts_permission;

  const trustedContactsCount = Math.max(
    apiOnboarding?.trusted_contacts_count ?? 0,
    trustedCount,
    trustedMinMet ? 1 : 0
  );

  const groupsCreatedCount = Math.max(
    apiOnboarding?.groups_created_count ?? 0,
    groups.length
  );

  const flags = computeOnboardingFlags({
    isAuthenticated: state.isAuthenticated,
    phoneVerified: Boolean(user?.phoneVerified || state.hasVerifiedPhone),
    contactsSynced,
    trustedContactsCount,
    groupsCreatedCount,
    hasCompletedIntro: state.hasCompletedOnboarding,
    hasDevicePermissions: state.hasGrantedPermissions,
    apiOnboardingComplete: apiOnboarding?.onboarding_complete,
  });

  state.setOnboardingFlags(flags);
  return flags;
}

export async function markContactsSynced(): Promise<void> {
  await setContactsSynced(true);
  await patchOnboardingProgress({ contacts_synced: true });
  await refreshOnboardingFlags();
}

export async function markTrustedMinimumMet(): Promise<void> {
  await setTrustedMinimumMet(true);
  const count = await countAcceptedTrustedContacts().catch(() => 1);
  await patchOnboardingProgress({ trusted_contacts_count: Math.max(1, count) });
  await refreshOnboardingFlags();
}

export async function markGroupCreated(): Promise<void> {
  const groups = await fetchGroups().catch(() => []);
  await patchOnboardingProgress({ groups_created_count: groups.length });
  await refreshOnboardingFlags();
}

export async function markOnboardingComplete(): Promise<void> {
  await patchOnboardingProgress({ onboarding_complete: true });
  await refreshOnboardingFlags();
}
