import Constants from 'expo-constants';
import { isRunningInExpoGo } from 'expo';
import { Platform } from 'react-native';
import { GoogleSignInCancelledError } from '@/services/googleSignInErrors';

export { GoogleSignInCancelledError };

type GoogleSignInNativeModule = typeof import('@react-native-google-signin/google-signin');

let nativeModule: GoogleSignInNativeModule | null = null;
let nativeModuleChecked = false;
let configured = false;

function resolveWebClientId(): string | undefined {
  const fromEnv = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
  if (fromEnv) return fromEnv;

  const extra = Constants.expoConfig?.extra as { googleWebClientId?: string } | undefined;
  const fromConfig = extra?.googleWebClientId?.trim();
  return fromConfig || undefined;
}

const webClientId = resolveWebClientId();

async function loadNativeModule(): Promise<GoogleSignInNativeModule | null> {
  if (nativeModuleChecked) return nativeModule;
  nativeModuleChecked = true;

  if (Platform.OS !== 'android' && Platform.OS !== 'ios') {
    return null;
  }

  if (isRunningInExpoGo()) {
    console.info('[googleSignIn] Native Google Sign-In is not available in Expo Go.');
    return null;
  }

  try {
    nativeModule = await import('@react-native-google-signin/google-signin');
    return nativeModule;
  } catch (error) {
    console.warn('[googleSignIn] Native module unavailable:', error);
    return null;
  }
}

/** Native Google Sign-In (store/dev builds). Not available in Expo Go or web production. */
export function isGoogleSignInAvailable(): boolean {
  if (isRunningInExpoGo()) return false;
  if (Platform.OS === 'android' || Platform.OS === 'ios') return Boolean(webClientId);
  return Platform.OS === 'web' && __DEV__;
}

export function usesDevGoogleSignIn(): boolean {
  return Platform.OS === 'web' && __DEV__;
}

export async function configureGoogleSignIn(): Promise<void> {
  if (configured) return;

  const mod = await loadNativeModule();
  if (!mod) return;

  if (!webClientId) {
    console.warn('[googleSignIn] EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not set.');
    return;
  }

  mod.GoogleSignin.configure({
    webClientId,
    offlineAccess: false,
  });
  configured = true;
}

export async function getGoogleIdToken(): Promise<string> {
  await configureGoogleSignIn();

  if (Platform.OS === 'web') {
    throw new Error('Native Google Sign-In is not available on web.');
  }

  const mod = await loadNativeModule();
  if (!mod) {
    throw new Error(
      'Google Sign-In requires a development or store build. Expo Go is not supported — use email sign-in or install your EAS build.'
    );
  }

  if (!webClientId) {
    throw new Error(
      'Google Sign-In is not configured. Add EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID to your environment.'
    );
  }

  const { GoogleSignin, isCancelledResponse, isSuccessResponse } = mod;

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
    const mod = await loadNativeModule();
    if (!mod) return;
    await configureGoogleSignIn();
    await mod.GoogleSignin.signOut();
  } catch {
    // Best-effort only.
  }
}
