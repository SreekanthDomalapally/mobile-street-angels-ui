type ErrorContext = Record<string, unknown>;

/** Lightweight error logging. Add @sentry/react-native later if crash reporting is needed. */
export async function captureException(error: unknown, context?: ErrorContext): Promise<void> {
  console.error('[observability]', error, context);
}

export function captureMessage(message: string, context?: ErrorContext): void {
  if (__DEV__) {
    console.info('[observability]', message, context);
    return;
  }
  console.warn('[observability]', message, context);
}
