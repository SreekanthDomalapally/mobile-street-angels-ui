import type { User } from '@/types';
import { apiRequest } from './client';

export interface TokenPair {
  access_token: string;
  refresh_token: string;
  token_type?: string;
}

export interface ApiUserResponse {
  id: string;
  full_name: string;
  email: string;
  phone_number?: string | null;
  profile_photo?: string | null;
}

export function mapApiUser(apiUser: ApiUserResponse): User {
  return {
    id: apiUser.id,
    displayName: apiUser.full_name,
    email: apiUser.email,
    phone: apiUser.phone_number ?? undefined,
    avatarUrl: apiUser.profile_photo ?? undefined,
    photoURL: apiUser.profile_photo ?? undefined,
  };
}

export async function authenticateWithGoogle(idToken: string): Promise<TokenPair> {
  return apiRequest<TokenPair>('/auth/google', {
    method: 'POST',
    body: JSON.stringify({ id_token: idToken }),
  });
}

export async function fetchCurrentUser(accessToken: string): Promise<User> {
  const apiUser = await apiRequest<ApiUserResponse>('/auth/me', { token: accessToken });
  return mapApiUser(apiUser);
}

export async function refreshAuthTokens(refreshToken: string): Promise<TokenPair> {
  return apiRequest<TokenPair>('/auth/refresh', {
    method: 'POST',
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
}

export async function registerDeviceToken(
  accessToken: string,
  pushToken: string,
  platform: string
): Promise<void> {
  await apiRequest<void>('/auth/devices', {
    method: 'POST',
    token: accessToken,
    body: JSON.stringify({ token: pushToken, platform }),
  });
}
