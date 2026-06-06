import {
  authenticateWithGoogle,
  fetchCurrentUser,
  loginWithEmail,
  refreshAuthTokens,
  registerWithEmail,
  type LoginParams,
  type RegisterParams,
} from '@/services/api/auth';
import {
  configureGoogleSignIn,
  getGoogleIdToken,
  GoogleSignInCancelledError,
  signOutGoogle,
  usesDevGoogleSignIn,
} from '@/services/googleSignIn';
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
  if (usesDevGoogleSignIn()) {
    const user = await signInWithGoogleMock();
    return user;
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
  configureGoogleSignIn();

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
  await Promise.allSettled([signOutGoogle(), firebaseSignOut(), clearAuthTokens()]);
}

export async function getAccessToken(): Promise<string | null> {
  const stored = await getAuthTokens();
  return stored?.accessToken ?? null;
}

export async function refreshAccessToken(): Promise<string | null> {
  const stored = await getAuthTokens();
  if (!stored) return null;

  try {
    const tokens = await refreshAuthTokens(stored.refreshToken);
    await saveAuthTokens(tokens.access_token, tokens.refresh_token);
    return tokens.access_token;
  } catch {
    await clearAuthTokens();
    return null;
  }
}
