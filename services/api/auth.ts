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

export interface RegisterParams {
  fullName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

export interface LoginParams {
  email: string;
  password: string;
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

export async function registerWithEmail(params: RegisterParams): Promise<TokenPair> {
  return apiRequest<TokenPair>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({
      full_name: params.fullName,
      email: params.email,
      password: params.password,
      phone_number: params.phoneNumber,
    }),
  });
}

export async function loginWithEmail(params: LoginParams): Promise<TokenPair> {
  return apiRequest<TokenPair>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({
      email: params.email,
      password: params.password,
    }),
  });
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
