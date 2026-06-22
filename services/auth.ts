import {
  authenticateWithFirebase,
  authenticateWithGoogle,
  fetchCurrentUser,
  fetchOnboardingStatus,
  loginWithEmail,
  mapApiUser,
  refreshAuthTokens,
  registerWithEmail,
  type LoginParams,
  type RegisterParams,
} from '@/services/api/auth';
import { GoogleSignInCancelledError } from '@/services/googleSignInErrors';
import { signInWithGoogleMock, signOut as firebaseSignOut } from '@/services/firebase';
import { clearAuthTokens, getAuthTokens, saveAuthTokens } from '@/services/tokenStorage';
import { unregisterPushFromServer } from '@/services/pushRegistration';
import { clearOnboardingProgress } from '@/services/onboardingProgress';
import { useSOSStore } from '@/stores/sosStore';
import { refreshOnboardingFlags } from '@/services/onboardingState';
import { useAuthStore } from '@/stores/authStore';
import type { User } from '@/types';

export { GoogleSignInCancelledError };

async function applyOnboardingFromUser(user: User, accessToken: string) {
  useAuthStore.getState().setUser(user);
  try {
    const onboarding = await fetchOnboardingStatus(accessToken);
    useAuthStore.getState().setOnboarding(onboarding);
  } catch {
    useAuthStore.getState().setPhoneVerified(Boolean(user.phoneVerified));
  }
  await refreshOnboardingFlags().catch(() => undefined);
}

export async function signInWithEmail(params: LoginParams): Promise<User> {
  const tokens = await loginWithEmail(params);
  await saveAuthTokens(tokens.access_token, tokens.refresh_token);
  const user = await fetchCurrentUser(tokens.access_token);
  await applyOnboardingFromUser(user, tokens.access_token);
  return user;
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

  let firebaseIdToken: string | null = null;
  try {
    const { signInWithGoogle: firebaseSignInWithGoogle, getFirebaseIdToken } = await import(
      '@/services/firebase'
    );
    await firebaseSignInWithGoogle(googleIdToken);
    firebaseIdToken = await getFirebaseIdToken();
  } catch (error) {
    console.warn('[auth] Firebase sign-in skipped:', error);
  }

  if (firebaseIdToken) {
    try {
      const response = await authenticateWithFirebase(firebaseIdToken);
      await saveAuthTokens(response.access_token, response.refresh_token);
      const user = mapApiUser(response.user);
      useAuthStore.getState().setOnboarding(response.onboarding);
      useAuthStore.getState().setUser(user);
      return user;
    } catch (error) {
      console.warn('[auth] Firebase backend login failed, falling back to Google:', error);
    }
  }

  const tokens = await authenticateWithGoogle(googleIdToken);
  await saveAuthTokens(tokens.access_token, tokens.refresh_token);
  const user = await fetchCurrentUser(tokens.access_token);
  await applyOnboardingFromUser(user, tokens.access_token);
  return user;
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
  useAuthStore.getState().signOut();
}

export { getAccessToken, refreshAccessToken } from '@/services/tokens';
