import type { OnboardingFlags, OnboardingStep } from '@/types';
import type { Group } from '@/types';

export function computeOnboardingFlags(input: {
  isAuthenticated: boolean;
  phoneVerified: boolean;
  contactsSynced: boolean;
  trustedContactsCount: number;
  groupsCreatedCount: number;
  hasCompletedIntro: boolean;
  hasDevicePermissions: boolean;
  apiOnboardingComplete?: boolean;
  onboarding?: { needs_profile_setup?: boolean } | null;
}): OnboardingFlags {
  const isRegistered = input.isAuthenticated;
  const isPhoneVerified = input.phoneVerified;
  const trustedContactsCount = input.trustedContactsCount;
  const groupsCreatedCount = input.groupsCreatedCount;
  const needsProfileSetup = Boolean(input.onboarding?.needs_profile_setup);

  const localOnboardingComplete =
    isRegistered &&
    isPhoneVerified &&
    !needsProfileSetup &&
    input.contactsSynced &&
    trustedContactsCount >= 1 &&
    groupsCreatedCount >= 1 &&
    input.hasDevicePermissions;

  // Server "complete" only covers account setup — notifications/location stay on-device.
  const onboardingComplete =
    localOnboardingComplete ||
    (input.apiOnboardingComplete === true && input.hasDevicePermissions);

  let nextStep: OnboardingStep = 'home';

  if (onboardingComplete) {
    return {
      is_registered: isRegistered,
      is_phone_verified: isPhoneVerified,
      contacts_synced: input.contactsSynced,
      trusted_contacts_count: trustedContactsCount,
      groups_created_count: groupsCreatedCount,
      onboarding_complete: true,
      next_step: 'home',
    };
  }

  if (!input.hasCompletedIntro) {
    nextStep = 'intro';
  } else if (!isRegistered) {
    nextStep = 'login';
  } else if (!isPhoneVerified) {
    nextStep = 'phone_verify';
  } else if (needsProfileSetup) {
    nextStep = 'profile_setup';
  } else if (!input.contactsSynced) {
    nextStep = 'contact_sync';
  } else if (trustedContactsCount < 1) {
    nextStep = 'trusted_contacts';
  } else if (groupsCreatedCount < 1) {
    nextStep = 'create_group';
  } else if (!input.hasDevicePermissions) {
    nextStep = 'device_permissions';
  } else {
    nextStep = 'home';
  }

  return {
    is_registered: isRegistered,
    is_phone_verified: isPhoneVerified,
    contacts_synced: input.contactsSynced,
    trusted_contacts_count: trustedContactsCount,
    groups_created_count: groupsCreatedCount,
    onboarding_complete: onboardingComplete,
    next_step: nextStep,
  };
}

export function onboardingStepToHref(step: OnboardingStep): string {
  switch (step) {
    case 'intro':
      return '/(auth)/onboarding';
    case 'login':
      return '/(auth)/login';
    case 'phone_verify':
      return '/(auth)/verify-phone';
    case 'profile_setup':
      return '/(auth)/profile-setup';
    case 'contact_sync':
      return '/(auth)/contact-sync';
    case 'trusted_contacts':
      return '/(auth)/trusted-contacts';
    case 'create_group':
      return '/(auth)/create-first-group';
    case 'device_permissions':
      return '/(auth)/permissions';
    case 'home':
    default:
      return '/(tabs)';
  }
}

export function countGroups(groups: Group[] | undefined): number {
  return groups?.length ?? 0;
}
