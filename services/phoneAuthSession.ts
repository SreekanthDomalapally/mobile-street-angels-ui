/** In-memory dev OTP from the last phone/login/start call (not passed in URL). */
let lastDevOtp: string | null = null;

export function setLastDevOtp(code: string | null | undefined): void {
  lastDevOtp = code?.trim() || null;
}

export function getLastDevOtp(): string | null {
  return lastDevOtp;
}
