const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? 'https://api.streetangels.example/v1').replace(
  /\/+$/,
  ''
);

function parseApiErrorMessage(body: unknown, status: number): string {
  if (!body || typeof body !== 'object') {
    return `Request failed (${status})`;
  }

  const record = body as Record<string, unknown>;
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

interface RequestOptions extends RequestInit {
  token?: string;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { token, headers, ...rest } = options;

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...rest,
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
}
