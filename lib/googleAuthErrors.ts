import { ApiError } from '@/services/api/http';
import { GoogleSignInCancelledError } from '@/services/googleSignInErrors';

/** Map native/API Google sign-in failures to actionable messages for real users. */
export function formatGoogleSignInError(error: unknown): string {
  if (error instanceof GoogleSignInCancelledError) {
    return '';
  }

  if (error instanceof ApiError) {
    if (error.status === 401 && /invalid google token/i.test(error.message)) {
      return (
        'Google sign-in worked on your phone, but the server rejected the token. ' +
        'On Railway, set GOOGLE_OAUTH_CLIENT_ID to the Firebase Web client ID ' +
        '(1065150630879-prjdgu45hcopbcdbt6dr2c2sbt24u4kn.apps.googleusercontent.com).'
      );
    }
    if (error.status === 0) {
      return error.message;
    }
    return error.message;
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
