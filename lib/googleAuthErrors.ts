import { ApiError } from '@/services/api/http';
import { GoogleSignInCancelledError } from '@/services/googleSignInErrors';
import { toUserFacingErrorMessage } from '@/lib/userFacingErrors';

/** Map native/API Google sign-in failures to actionable messages for real users. */
export function formatGoogleSignInError(error: unknown): string {
  if (error instanceof GoogleSignInCancelledError) {
    return '';
  }

  if (error instanceof ApiError) {
    if (error.status === 401 && /invalid google token/i.test(error.message)) {
      return (
        'Google sign-in worked on your phone, but we could not verify your account. ' +
        'Please try again later or contact support@youhooalert.com.'
      );
    }
    if (error.status === 0) {
      return toUserFacingErrorMessage(error.message);
    }
    return toUserFacingErrorMessage(error.message);
  }

  const message = error instanceof Error ? error.message : 'Sign in failed. Please try again.';
  const code =
    error && typeof error === 'object' && 'code' in error
      ? String((error as { code: unknown }).code)
      : '';

  if (code === '10' || /DEVELOPER_ERROR/i.test(message)) {
    return (
      'Google Sign-In is not configured for this install. ' +
      'Add your EAS build SHA-1 fingerprint in Firebase → Project settings → Android app (com.youhooalert.com), then rebuild.'
    );
  }

  if (/id token/i.test(message)) {
    return message;
  }

  if (/Expo Go/i.test(message)) {
    return message;
  }

  if (/not configured/i.test(message)) {
    return message;
  }

  return message;
}

export function isGoogleSignInCancelled(error: unknown): boolean {
  return error instanceof GoogleSignInCancelledError;
}
