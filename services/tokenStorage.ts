import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'street-angels-access-token';
const REFRESH_TOKEN_KEY = 'street-angels-refresh-token';

export interface StoredAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export async function saveAuthTokens(accessToken: string, refreshToken: string): Promise<void> {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
}

export async function getAuthTokens(): Promise<StoredAuthTokens | null> {
  const accessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  const refreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);

  if (!accessToken || !refreshToken) return null;
  return { accessToken, refreshToken };
}

export async function clearAuthTokens(): Promise<void> {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
}
