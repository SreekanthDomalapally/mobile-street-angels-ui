/** Backend returns dev_otp when API ENVIRONMENT=development or DEV_OTP_ENABLED=true (no SMS). */
export function testOtpHint(devOtp?: string | null): string | null {
  const code = devOtp?.trim();
  if (!code) return null;
  return `Test code (no SMS sent): ${code}`;
}

export function usesBackendPhoneOtp(): boolean {
  const useFirebasePhone =
    process.env.EXPO_PUBLIC_USE_FIREBASE_PHONE === 'true' && !__DEV__;
  return !useFirebasePhone;
}
