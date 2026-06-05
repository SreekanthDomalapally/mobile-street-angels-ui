import { Platform } from 'react-native';
import {
  GoogleSignin,
  isCancelledResponse,
  isSuccessResponse,
} from '@react-native-google-signin/google-signin';

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

let configured = false;

export function configureGoogleSignIn(): void {
  if (configured) return;

  if (!webClientId) {
    console.warn('[googleSignIn] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not set.');
    return;
  }

  GoogleSignin.configure({
    webClientId,
    offlineAccess: false,
  });
  configured = true;
}

export class GoogleSignInCancelledError extends Error {
  constructor() {
    super('Sign in cancelled');
    this.name = 'GoogleSignInCancelledError';
  }
}

export function isGoogleSignInAvailable(): boolean {
  return Platform.OS === 'android' || Platform.OS === 'ios';
}

export async function getGoogleIdToken(): Promise<string> {
  configureGoogleSignIn();

  if (!isGoogleSignInAvailable()) {
    throw new Error('Google Sign-In is only available on Android and iOS device builds.');
  }

  if (!webClientId) {
    throw new Error(
      'Google Sign-In is not configured. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your environment.'
    );
  }

  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();
  if (isCancelledResponse(response)) {
    throw new GoogleSignInCancelledError();
  }

  if (!isSuccessResponse(response)) {
    throw new Error('Google Sign-In failed.');
  }

  const idToken = response.data.idToken ?? (await GoogleSignin.getTokens()).idToken;
  if (!idToken) {
    throw new Error(
      'Google did not return an ID token. Verify EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID matches your Firebase Web client ID.'
    );
  }

  return idToken;
}

export async function signOutGoogle(): Promise<void> {
  try {
    configureGoogleSignIn();
    await GoogleSignin.signOut();
  } catch {
    // Best-effort only.
  }
}
