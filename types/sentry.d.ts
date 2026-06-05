declare module '@sentry/react-native' {
  export function init(options: Record<string, unknown>): void;
  export function captureException(error: unknown, context?: Record<string, unknown>): void;
  export function captureMessage(message: string, context?: Record<string, unknown>): void;
}
