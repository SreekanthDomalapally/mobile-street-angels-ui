type ErrorContext = Record<string, unknown>;

let sentryReady = false;

async function initSentryIfConfigured(): Promise<void> {
  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn || sentryReady) return;

  try {
    const Sentry = await import('@sentry/react-native');
    Sentry.init({
      dsn,
      enabled: !__DEV__,
      tracesSampleRate: 0.2,
    });
    sentryReady = true;
  } catch {
    // Sentry is optional — app runs without it.
  }
}

export async function captureException(error: unknown, context?: ErrorContext): Promise<void> {
  if (__DEV__) {
    console.error('[observability]', error, context);
    return;
  }

  await initSentryIfConfigured();

  if (sentryReady) {
    const Sentry = await import('@sentry/react-native');
    Sentry.captureException(error, { extra: context });
    return;
  }

  console.error('[observability]', error, context);
}

export function captureMessage(message: string, context?: ErrorContext): void {
  if (__DEV__) {
    console.info('[observability]', message, context);
    return;
  }

  void initSentryIfConfigured().then(async () => {
    if (sentryReady) {
      const Sentry = await import('@sentry/react-native');
      Sentry.captureMessage(message, { extra: context });
    }
  });
}
