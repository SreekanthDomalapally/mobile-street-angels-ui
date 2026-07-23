import type { PhoneSignInSession } from '@/services/firebasePhoneAuth';

/** In-memory phone auth state (confirmation cannot be passed in URL params). */
let lastDevOtp: string | null = null;
let lastPhoneSession: PhoneSignInSession | null = null;

export function setLastDevOtp(code: string | null | undefined): void {
  lastDevOtp = code?.trim() || null;
}

export function getLastDevOtp(): string | null {
  return lastDevOtp;
}

export function setLastPhoneSession(session: PhoneSignInSession | null): void {
  lastPhoneSession = session;
  setLastDevOtp(session?.devOtp);
}

export function getLastPhoneSession(): PhoneSignInSession | null {
  return lastPhoneSession;
}

export function clearLastPhoneSession(): void {
  lastPhoneSession = null;
  lastDevOtp = null;
}
