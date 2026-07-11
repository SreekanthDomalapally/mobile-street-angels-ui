import { isFirebasePhoneAuthEnabled } from '@/services/firebasePhoneAuth';

/** Backend returns dev_otp when API ENVIRONMENT=development or DEV_OTP_ENABLED=true (no SMS). */
export function testOtpHint(devOtp?: string | null): string | null {
  const code = devOtp?.trim();
  if (!code) return null;
  return `Test code (no SMS sent): ${code}`;
}

/** Local dev / Expo Go uses backend OTP; EAS preview+production use Firebase SMS when enabled. */
export function usesBackendPhoneOtp(): boolean {
  return !isFirebasePhoneAuthEnabled();
}
