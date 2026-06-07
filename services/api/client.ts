import { getAccessToken, refreshAccessToken } from '@/services/tokens';
import { ApiError, apiRequest, getAlertWebSocketUrl, getApiBaseUrl, getApiOrigin } from './http';

export { ApiError, apiRequest, getAlertWebSocketUrl, getApiBaseUrl, getApiOrigin };

interface RequestOptions extends RequestInit {
  token?: string;
  timeoutMs?: number;
}

export async function authenticatedRequest<T>(
  endpoint: string,
  options: Omit<RequestOptions, 'token'> = {}
): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError('Please sign in to continue.', 401, 'unauthorized');
  }

  try {
    return await apiRequest<T>(endpoint, { ...options, token });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      const refreshed = await refreshAccessToken();
      if (refreshed) {
        return apiRequest<T>(endpoint, { ...options, token: refreshed });
      }
      throw new ApiError('Session expired. Please sign in again.', 401, 'unauthorized');
    }
    throw error;
  }
}
