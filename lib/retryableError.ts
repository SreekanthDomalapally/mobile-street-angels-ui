export function isRetryableError(error: unknown): boolean {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = Number((error as { status: unknown }).status);
    if (!Number.isNaN(status)) {
      return status === 0 || status === 408 || status >= 500;
    }
  }

  return error instanceof TypeError;
}
