import { computeOnboardingFlags, onboardingStepToHref } from '@/lib/onboarding';
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
import { type Href, router } from 'expo-router';

export async function refreshOnboardingFlags(): Promise<OnboardingFlags> {
  const state = useAuthStore.getState();
  const user = state.user;

  let apiOnboarding = state.onboarding;
  const token = await getAccessToken();
  if (token) {
    try {
      apiOnboarding = await fetchOnboardingStatus(token);
    } catch {
      // Keep cached onboarding flags when offline.
    }
  }

  const existingFlags = state.onboardingFlags;

  const [contactsSyncedLocal, trustedMinMet, groups, trustedCount] = await Promise.all([
    getContactsSynced(),
    getTrustedMinimumMet(),
    fetchGroups().catch(() => null),
    countAcceptedTrustedContacts().catch(() => null),
  ]);

  const contactsSynced =
    contactsSyncedLocal ||
    existingFlags?.contacts_synced === true ||
    apiOnboarding?.contacts_synced === true;

  if (apiOnboarding) {
    state.setOnboarding({
      ...apiOnboarding,
      contacts_synced: contactsSynced,
    });
  }

  const trustedContactsCount = Math.max(
    apiOnboarding?.trusted_contacts_count ?? 0,
    trustedCount ?? 0,
    trustedMinMet ? 1 : 0,
    existingFlags?.trusted_contacts_count ?? 0
  );

  const groupsCreatedCount = Math.max(
    apiOnboarding?.groups_created_count ?? 0,
    groups?.length ?? 0,
    existingFlags?.groups_created_count ?? 0
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
    onboarding: apiOnboarding,
  });

  state.setOnboardingFlags(flags);
  return flags;
}

export async function navigateAfterOnboardingStep(): Promise<void> {
  const flags = await refreshOnboardingFlags();
  router.replace(onboardingStepToHref(flags.next_step) as Href);
}

export async function markContactsSynced(): Promise<void> {
  await setContactsSynced(true);
  await patchOnboardingProgress({ contacts_synced: true });
  const state = useAuthStore.getState();
  if (state.onboarding) {
    state.setOnboarding({ ...state.onboarding, contacts_synced: true });
  }
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
