import { apiRequest } from '@/services/api/http';
import { clearAuthTokens, getAuthTokens, saveAuthTokens } from '@/services/tokenStorage';

interface TokenPair {
  access_token: string;
  refresh_token: string;
}

/** Reads and refreshes stored JWTs. Depends only on http + secure storage (no api/client). */

export async function getAccessToken(): Promise<string | null> {
  const stored = await getAuthTokens();
  return stored?.accessToken ?? null;
}

export async function refreshAccessToken(): Promise<string | null> {
  const stored = await getAuthTokens();
  if (!stored) return null;

  try {
    const tokens = await apiRequest<TokenPair>('/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refresh_token: stored.refreshToken }),
    });
    await saveAuthTokens(tokens.access_token, tokens.refresh_token);
    return tokens.access_token;
  } catch {
    await clearAuthTokens();
    return null;
  }
}
