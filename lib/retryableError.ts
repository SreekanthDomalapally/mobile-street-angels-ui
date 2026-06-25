import { ApiError } from '@/services/api/client';

export function isRetryableError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = Number((error as { status: unknown }).status);
    if (!Number.isNaN(status)) {
      return status === 0 || status === 408 || status >= 500;
    }
  }

  return error instanceof TypeError;
}

/** Keep queued SOS payloads when a retry might succeed (e.g. after re-auth). */
export function shouldKeepQueuedSOS(error: unknown): boolean {
  if (isRetryableError(error)) return true;
  return error instanceof ApiError && error.status === 401;
}
