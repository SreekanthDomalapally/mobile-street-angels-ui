import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_TOKEN_KEY = 'street-angels-access-token';
const REFRESH_TOKEN_KEY = 'street-angels-refresh-token';

export interface StoredAuthTokens {
  accessToken: string;
  refreshToken: string;
}

/** In-memory cache avoids duplicate SecureStore reads during cold start. */
let memoryTokens: StoredAuthTokens | null | undefined;

function useSecureStore(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

async function setItem(key: string, value: string): Promise<void> {
  if (useSecureStore()) {
    await SecureStore.setItemAsync(key, value);
    return;
  }
  await AsyncStorage.setItem(key, value);
}

async function getItem(key: string): Promise<string | null> {
  if (useSecureStore()) {
    return SecureStore.getItemAsync(key);
  }
  return AsyncStorage.getItem(key);
}

async function deleteItem(key: string): Promise<void> {
  if (useSecureStore()) {
    await SecureStore.deleteItemAsync(key);
    return;
  }
  await AsyncStorage.removeItem(key);
}

export async function saveAuthTokens(accessToken: string, refreshToken: string): Promise<void> {
  memoryTokens = { accessToken, refreshToken };
  await setItem(ACCESS_TOKEN_KEY, accessToken);
  await setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export async function getAuthTokens(): Promise<StoredAuthTokens | null> {
  if (memoryTokens !== undefined) {
    return memoryTokens;
  }

  try {
    const accessToken = await getItem(ACCESS_TOKEN_KEY);
    const refreshToken = await getItem(REFRESH_TOKEN_KEY);

    if (!accessToken || !refreshToken) {
      memoryTokens = null;
      return null;
    }

    memoryTokens = { accessToken, refreshToken };
    return memoryTokens;
  } catch (error) {
    console.warn('[tokenStorage] Failed to read auth tokens:', error);
    memoryTokens = null;
    return null;
  }
}

export async function clearAuthTokens(): Promise<void> {
  memoryTokens = null;
  try {
    await deleteItem(ACCESS_TOKEN_KEY);
    await deleteItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.warn('[tokenStorage] Failed to clear auth tokens:', error);
  }
}
