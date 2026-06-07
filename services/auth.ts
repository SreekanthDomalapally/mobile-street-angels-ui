import {
  authenticateWithGoogle,
  fetchCurrentUser,
  loginWithEmail,
  refreshAuthTokens,
  registerWithEmail,
  type LoginParams,
  type RegisterParams,
} from '@/services/api/auth';
import { GoogleSignInCancelledError } from '@/services/googleSignInErrors';
import {
  signInWithGoogle as firebaseSignInWithGoogle,
  signInWithGoogleMock,
  signOut as firebaseSignOut,
} from '@/services/firebase';
import { clearAuthTokens, getAuthTokens, saveAuthTokens } from '@/services/tokenStorage';
import type { User } from '@/types';

export { GoogleSignInCancelledError };

export async function signInWithEmail(params: LoginParams): Promise<User> {
  const tokens = await loginWithEmail(params);
  await saveAuthTokens(tokens.access_token, tokens.refresh_token);
  return fetchCurrentUser(tokens.access_token);
}

export async function registerAndSignIn(params: RegisterParams): Promise<User> {
  const tokens = await registerWithEmail(params);
  await saveAuthTokens(tokens.access_token, tokens.refresh_token);
  return fetchCurrentUser(tokens.access_token);
}

export async function signInWithGoogle(): Promise<User> {
  const { getGoogleIdToken, usesDevGoogleSignIn } = await import('@/services/googleSignIn');

  if (usesDevGoogleSignIn()) {
    return signInWithGoogleMock();
  }

  const idToken = await getGoogleIdToken();

  try {
    await firebaseSignInWithGoogle(idToken);
  } catch (error) {
    console.warn('[auth] Firebase sign-in skipped:', error);
  }

  const tokens = await authenticateWithGoogle(idToken);
  await saveAuthTokens(tokens.access_token, tokens.refresh_token);
  return fetchCurrentUser(tokens.access_token);
}

export async function restoreSession(): Promise<User | null> {
  const stored = await getAuthTokens();
  if (!stored) return null;

  try {
    return await fetchCurrentUser(stored.accessToken);
  } catch {
    try {
      const tokens = await refreshAuthTokens(stored.refreshToken);
      await saveAuthTokens(tokens.access_token, tokens.refresh_token);
      return fetchCurrentUser(tokens.access_token);
    } catch {
      await clearAuthTokens();
      return null;
    }
  }
}

export async function signOut(): Promise<void> {
  const { signOutGoogle } = await import('@/services/googleSignIn');
  await Promise.allSettled([signOutGoogle(), firebaseSignOut(), clearAuthTokens()]);
}

export { getAccessToken, refreshAccessToken } from '@/services/tokens';
