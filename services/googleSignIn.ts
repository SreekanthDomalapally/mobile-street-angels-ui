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

/** Native Google Sign-In (Android/iOS builds). Web uses dev demo sign-in when __DEV__. */
export function isGoogleSignInAvailable(): boolean {
  if (Platform.OS === 'android' || Platform.OS === 'ios') return true;
  return Platform.OS === 'web' && __DEV__;
}

export function usesDevGoogleSignIn(): boolean {
  return Platform.OS === 'web' && __DEV__;
}

export async function getGoogleIdToken(): Promise<string> {
  configureGoogleSignIn();

  if (Platform.OS === 'web') {
    throw new Error('Native Google Sign-In is not available on web.');
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
