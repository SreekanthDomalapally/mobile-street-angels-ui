import {
  authenticateWithFirebase,
  authenticateWithGoogle,
  fetchCurrentUser,
  fetchOnboardingStatus,
  loginWithEmail,
  loginWithFirebaseToken,
  mapApiUser,
  refreshAuthTokens,
  registerWithEmail,
  type FirebaseLoginResponse,
  type LoginParams,
  type RegisterParams,
} from '@/services/api/auth';
import { GoogleSignInCancelledError } from '@/services/googleSignInErrors';
import { signInWithGoogleMock, signOut as firebaseSignOut } from '@/services/firebase';
import { clearAuthTokens, getAuthTokens, saveAuthTokens } from '@/services/tokenStorage';
import { unregisterPushFromServer } from '@/services/pushRegistration';
import { clearOnboardingProgress } from '@/services/onboardingProgress';
import { useTripWatchStore } from '@/stores/tripWatchStore';
import { useSOSStore } from '@/stores/sosStore';
import { clearPersistedActiveTrip } from '@/services/tripWatchStorage';
import { refreshOnboardingFlags } from '@/services/onboardingState';
import { syncPushTokenWithServer } from '@/services/pushRegistration';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types';

export { GoogleSignInCancelledError };

async function applySessionResponse(response: FirebaseLoginResponse) {
  await saveAuthTokens(response.access_token, response.refresh_token);
  const user = mapApiUser(response.user);
  useAuthStore.getState().setOnboarding(response.onboarding);
  useAuthStore.getState().setUser(user);
  await refreshOnboardingFlags().catch(() => undefined);
  void syncPushTokenWithServer().catch((error) => {
    console.warn('[auth] Push token sync after sign-in failed:', error);
  });
  return user;
}

export async function signInWithPhoneSession(response: FirebaseLoginResponse): Promise<User> {
  return applySessionResponse(response);
}

export async function signInWithFirebasePhone(firebaseIdToken: string): Promise<User> {
  const response = await loginWithFirebaseToken(firebaseIdToken);
  return applySessionResponse(response);
}

async function applyOnboardingFromUser(user: User, accessToken: string) {
  useAuthStore.getState().setUser(user);
  try {
    const onboarding = await fetchOnboardingStatus(accessToken);
    useAuthStore.getState().setOnboarding(onboarding);
  } catch {
    useAuthStore.getState().setPhoneVerified(Boolean(user.phoneVerified));
  }
}

export async function signInWithEmail(params: LoginParams): Promise<User> {
  const response = await loginWithEmail(params);
  return applySessionResponse(response);
}

export async function registerAndSignIn(params: RegisterParams): Promise<User> {
  const tokens = await registerWithEmail(params);
  await saveAuthTokens(tokens.access_token, tokens.refresh_token);
  const user = await fetchCurrentUser(tokens.access_token);
  await applyOnboardingFromUser(user, tokens.access_token);
  return user;
}

export async function signInWithGoogle(): Promise<User> {
  const { getGoogleIdToken, usesDevGoogleSignIn } = await import('@/services/googleSignIn');

  if (usesDevGoogleSignIn()) {
    const user = await signInWithGoogleMock();
    useAuthStore.getState().setUser(user);
    return user;
  }

  const googleIdToken = await getGoogleIdToken();
  let googleApiError: unknown;

  try {
    const tokens = await authenticateWithGoogle(googleIdToken);
    await saveAuthTokens(tokens.access_token, tokens.refresh_token);
    const user = await fetchCurrentUser(tokens.access_token);
    await applyOnboardingFromUser(user, tokens.access_token);
    return user;
  } catch (error) {
    googleApiError = error;
    console.warn('[auth] Direct Google API login failed, trying Firebase:', error);
  }

  try {
    const { signInWithGoogle: firebaseSignInWithGoogle, getFirebaseIdToken } = await import(
      '@/services/firebase'
    );
    await firebaseSignInWithGoogle(googleIdToken);
    const firebaseIdToken = await getFirebaseIdToken();
    if (!firebaseIdToken) {
      throw new Error('Firebase did not return a session token.');
    }

    const response = await authenticateWithFirebase(firebaseIdToken);
    await saveAuthTokens(response.access_token, response.refresh_token);
    const user = mapApiUser(response.user);
    useAuthStore.getState().setOnboarding(response.onboarding);
    useAuthStore.getState().setUser(user);
    return user;
  } catch (firebaseError) {
    console.warn('[auth] Firebase backend login failed:', firebaseError);
    throw googleApiError ?? firebaseError;
  }
}

export async function restoreSession(): Promise<User | null> {
  const stored = await getAuthTokens();
  if (!stored) return null;

  try {
    const user = await fetchCurrentUser(stored.accessToken);
    await applyOnboardingFromUser(user, stored.accessToken);
    return user;
  } catch {
    try {
      const tokens = await refreshAuthTokens(stored.refreshToken);
      await saveAuthTokens(tokens.access_token, tokens.refresh_token);
      const user = await fetchCurrentUser(tokens.access_token);
      await applyOnboardingFromUser(user, tokens.access_token);
      return user;
    } catch {
      await clearAuthTokens();
      return null;
    }
  }
}

export async function signOut(): Promise<void> {
  const { signOutGoogle } = await import('@/services/googleSignIn');
  await Promise.allSettled([
    signOutGoogle(),
    firebaseSignOut(),
    clearAuthTokens(),
    clearOnboardingProgress(),
    unregisterPushFromServer(),
  ]);
  useSOSStore.getState().resetSOS();
  useTripWatchStore.getState().resetTripWatch();
  await clearPersistedActiveTrip();
  useAuthStore.getState().signOut();
}

export { getAccessToken, refreshAccessToken } from '@/services/tokens';
