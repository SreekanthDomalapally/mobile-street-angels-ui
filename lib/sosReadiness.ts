import { onboardingStepToHref } from '@/lib/onboarding';
import type { Group, OnboardingFlags } from '@/types';

export interface SOSReadiness {
  ready: boolean;
  reason: string | null;
  ctaHref: string | null;
  ctaLabel: string | null;
  warning?: string | null;
  warningCtaHref?: string | null;
  warningCtaLabel?: string | null;
}

export function evaluateSOSReadiness(
  flags: OnboardingFlags,
  groups: Group[] | undefined,
  locationGranted: boolean,
  notificationsGranted = true,
  pushTokenRegistered = true,
): SOSReadiness {
  if (!flags.is_phone_verified) {
    return {
      ready: false,
      reason: 'Verify your mobile number before sending an SOS.',
      ctaHref: '/(auth)/verify-phone',
      ctaLabel: 'Verify phone',
    };
  }

  if (!flags.contacts_synced) {
    return {
      ready: false,
      reason: 'Sync contacts to connect with people you trust.',
      ctaHref: '/(auth)/contact-sync',
      ctaLabel: 'Sync contacts',
    };
  }

  if (flags.trusted_contacts_count < 1) {
    return {
      ready: false,
      reason: 'Add at least one trusted contact who can respond.',
      ctaHref: '/(auth)/trusted-contacts',
      ctaLabel: 'Add trusted contact',
    };
  }

  if (!groups?.length) {
    return {
      ready: false,
      reason: 'Create a safety group before sending an SOS.',
      ctaHref: '/(auth)/create-first-group',
      ctaLabel: 'Create group',
    };
  }

  if (!locationGranted) {
    return {
      ready: false,
      reason: 'Location access is required during an emergency alert.',
      ctaHref: '/(auth)/permissions',
      ctaLabel: 'Enable location',
    };
  }

  if (!flags.onboarding_complete) {
    return {
      ready: false,
      reason: 'Finish setup to activate emergency alerts.',
      ctaHref: onboardingStepToHref(flags.next_step),
      ctaLabel: 'Continue setup',
    };
  }

  if (!notificationsGranted) {
    return {
      ready: true,
      reason: null,
      ctaHref: null,
      ctaLabel: null,
      warning: 'Enable notifications so you receive SOS alerts from your circle.',
      warningCtaHref: '/(auth)/permissions',
      warningCtaLabel: 'Enable notifications',
    };
  }

  if (!pushTokenRegistered) {
    return {
      ready: true,
      reason: null,
      ctaHref: null,
      ctaLabel: null,
      warning:
        'This phone is not registered for push alerts. Your circle may not get notified when you send SOS.',
      warningCtaHref: '/(auth)/permissions',
      warningCtaLabel: 'Fix notifications',
    };
  }

  return { ready: true, reason: null, ctaHref: null, ctaLabel: null };
}
