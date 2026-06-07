import Constants from 'expo-constants';

const PRODUCTION_API_URL = 'https://street-angels-api-production.up.railway.app/api/v1';

function resolveApiBaseUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL?.trim();
  if (fromEnv && !fromEnv.includes('streetangels.example')) {
    return fromEnv.replace(/\/+$/, '');
  }

  const extra = Constants.expoConfig?.extra as { apiUrl?: string } | undefined;
  const fromExtra = extra?.apiUrl?.trim();
  if (fromExtra && !fromExtra.includes('streetangels.example')) {
    return fromExtra.replace(/\/+$/, '');
  }

  return PRODUCTION_API_URL;
}

const API_BASE_URL = resolveApiBaseUrl();

const REQUEST_TIMEOUT_MS = 20_000;

function parseApiErrorMessage(body: unknown, status: number): string {
  if (!body || typeof body !== 'object') {
    if (status >= 500) {
      return 'Server error. Please try again in a moment.';
    }
    return `Request failed (${status})`;
  }

  const record = body as Record<string, unknown>;
  if (typeof record.error === 'string') return record.error;
  if (typeof record.message === 'string') return record.message;
  if (typeof record.detail === 'string') return record.detail;
  if (Array.isArray(record.detail)) {
    return record.detail
      .map((item) => {
        if (typeof item === 'string') return item;
        if (item && typeof item === 'object' && 'msg' in item) {
          return String((item as { msg: unknown }).msg);
        }
        return 'Validation error';
      })
      .join(', ');
  }

  return `Request failed (${status})`;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface HttpRequestOptions extends RequestInit {
  token?: string;
  timeoutMs?: number;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export function getApiOrigin(): string {
  return API_BASE_URL.replace(/\/api\/v1$/, '');
}

export function getAlertWebSocketUrl(alertId: string, token: string): string {
  const configured = process.env.EXPO_PUBLIC_WS_URL?.replace(/\/+$/, '');
  const base = configured?.includes('/ws/alerts')
    ? configured
    : `${getApiOrigin().replace(/^http/, 'ws')}/ws/alerts`;
  return `${base}/${alertId}?token=${encodeURIComponent(token)}`;
}

export async function apiRequest<T>(
  endpoint: string,
  options: HttpRequestOptions = {}
): Promise<T> {
  const { token, headers, timeoutMs = REQUEST_TIMEOUT_MS, ...rest } = options;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...rest,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new ApiError(
        parseApiErrorMessage(body, response.status),
        response.status,
        typeof body === 'object' && body && 'code' in body ? String(body.code) : undefined
      );
    }

    if (response.status === 204) return undefined as T;
    return response.json();
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (error instanceof Error && error.name === 'AbortError') {
      throw new ApiError('Request timed out. Check your connection.', 408, 'timeout');
    }
    if (error instanceof TypeError) {
      throw new ApiError(
        `Cannot reach API at ${API_BASE_URL}. Check your internet connection and try again.`,
        0,
        'network'
      );
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}
