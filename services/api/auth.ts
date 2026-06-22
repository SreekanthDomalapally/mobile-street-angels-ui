import type { OnboardingStatus, User } from '@/types';
import { apiRequest } from './http';

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
  phone_verified?: boolean;
  profile_photo?: string | null;
}

export interface FirebaseLoginResponse extends TokenPair {
  user: ApiUserResponse;
  onboarding: OnboardingStatus;
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
    phoneVerified: Boolean(apiUser.phone_verified),
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

export async function authenticateWithFirebase(firebaseIdToken: string): Promise<FirebaseLoginResponse> {
  return apiRequest<FirebaseLoginResponse>('/auth/firebase-login', {
    method: 'POST',
    body: JSON.stringify({ firebase_id_token: firebaseIdToken }),
  });
}

export async function fetchCurrentUser(accessToken: string): Promise<User> {
  const apiUser = await apiRequest<ApiUserResponse>('/auth/me', { token: accessToken });
  return mapApiUser(apiUser);
}

export async function fetchOnboardingStatus(accessToken: string): Promise<OnboardingStatus> {
  return apiRequest<OnboardingStatus>('/auth/onboarding', { token: accessToken });
}

export async function startPhoneVerification(
  accessToken: string,
  phoneNumber: string,
  countryCode = 'IE'
): Promise<{ session_id: string; dev_otp?: string | null }> {
  return apiRequest('/auth/phone/start', {
    method: 'POST',
    token: accessToken,
    body: JSON.stringify({ phone_number: phoneNumber, country_code: countryCode }),
  });
}

export async function verifyPhoneOtp(
  accessToken: string,
  phoneNumber: string,
  otp: string,
  countryCode = 'IE'
): Promise<User> {
  const apiUser = await apiRequest<ApiUserResponse>('/auth/phone/verify', {
    method: 'POST',
    token: accessToken,
    body: JSON.stringify({ phone_number: phoneNumber, otp, country_code: countryCode }),
  });
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
