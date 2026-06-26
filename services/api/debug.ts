import { ApiError } from './http';
import { getAccessToken } from '@/services/tokens';
import { getApiOrigin } from './http';

export interface AlertDeliveryReport {
  alert_id: string;
  sender: { user_id: string; display_name: string | null };
  emergency_type: { code: string; canonical: string; label: string };
  matching_groups: Array<{
    group_id: string;
    group_name: string | null;
    emergency_types: string[];
    matched_by_type: boolean;
    forced_primary_group: boolean;
  }>;
  selected_recipients: Array<{
    user_id: string;
    display_name: string | null;
    delivery_status: string;
    delivery_error: string | null;
  }>;
  recipient_count: number;
  recipients_without_tokens: string[];
  delivery_status?: { delivered: number; failed: number; pending: number };
  skipped_members_with_reasons?: Array<{
    display_name: string | null;
    membership_status: string;
    skip_reason: string | null;
  }>;
}

export interface RoutingPreview {
  emergency_type: string;
  primary_group_id: string;
  recipient_count: number;
  recipient_user_ids: string[];
}

async function debugRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = await getAccessToken();
  if (!token) {
    throw new ApiError('Please sign in to continue.', 401, 'unauthorized');
  }
  const response = await fetch(`${getApiOrigin()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      typeof body === 'object' && body && 'error' in body
        ? String(body.error)
        : `Request failed (${response.status})`,
      response.status,
    );
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export async function fetchAlertDeliveryReport(alertId: string): Promise<AlertDeliveryReport> {
  return debugRequest<AlertDeliveryReport>(`/debug/alerts/${alertId}/delivery`);
}

export async function fetchSosRoutingPreview(
  emergencyType: string,
  groupId: string,
): Promise<RoutingPreview> {
  const params = new URLSearchParams({
    emergency_type: emergencyType,
    group_id: groupId,
  });
  return debugRequest<RoutingPreview>(`/debug/sos/routing-preview?${params.toString()}`);
}

export async function sendTestPushToMe(): Promise<void> {
  await debugRequest('/debug/push/test-me', { method: 'POST' });
}

export async function sendTestPushToGroup(
  emergencyType: string,
  groupId: string,
): Promise<void> {
  const params = new URLSearchParams({
    emergency_type: emergencyType,
    group_id: groupId,
  });
  await debugRequest(`/debug/push/test-group?${params.toString()}`, { method: 'POST' });
}
