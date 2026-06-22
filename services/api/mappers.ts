import type {
  ActivityItem,
  AlertStatus,
  CircleContact,
  EmergencyType,
  Group,
  GroupInvite,
  Responder,
  ResponderStatus,
  SOSAlert,
  TimelineEvent,
} from '@/types';

/** API alert_type enum values */
export type ApiAlertType =
  | 'unsafe_situation'
  | 'medical_help'
  | 'car_breakdown'
  | 'pickup_request'
  | 'custom';

export type ApiAlertStatus = 'active' | 'resolved' | 'cancelled';

export interface ApiAlertResponseItem {
  id: string;
  user_id: string;
  response_type: string;
  eta_minutes: number | null;
  created_at: string;
}

export interface ApiAlertOut {
  id: string;
  created_by: string;
  group_id: string;
  alert_type: ApiAlertType | string;
  message: string | null;
  latitude: number;
  longitude: number;
  status: ApiAlertStatus | string;
  created_at: string;
  resolved_at: string | null;
  responses: ApiAlertResponseItem[];
}

export interface ApiGroupMemberOut {
  user_id: string;
  full_name: string;
  email: string;
  role: string;
}

export interface ApiGroupPendingInviteOut {
  id: string;
  invitee_email: string;
  inviter_name: string;
  status: string;
  created_at: string;
}

export interface ApiGroupOut {
  id: string;
  name: string;
  description: string | null;
  is_temporary: boolean;
  expires_at: string | null;
  created_by: string;
  created_at: string;
  member_count?: number;
  my_role?: string | null;
  members?: ApiGroupMemberOut[];
  pending_invites?: ApiGroupPendingInviteOut[];
}

export interface ApiGroupInviteOut {
  id: string;
  group_id: string;
  group_name: string;
  inviter_name: string;
  invitee_email: string;
  status: string;
  created_at: string;
}

export interface ApiContactDirectoryItem {
  user_id: string | null;
  display_name: string | null;
  email: string | null;
  phone: string | null;
  group_ids: string[];
  status: 'member' | 'invited';
}

const EMERGENCY_TO_API: Record<EmergencyType, ApiAlertType> = {
  medical: 'medical_help',
  safety: 'unsafe_situation',
  harassment: 'unsafe_situation',
  accident: 'car_breakdown',
  other: 'custom',
};

const API_TO_EMERGENCY: Record<string, EmergencyType> = {
  medical_help: 'medical',
  unsafe_situation: 'safety',
  car_breakdown: 'accident',
  pickup_request: 'other',
  custom: 'other',
};

const RESPONSE_TO_STATUS: Record<string, ResponderStatus> = {
  i_can_help: 'notified',
  on_my_way: 'en_route',
  calling_now: 'en_route',
  unable_to_help: 'completed',
};

export function mapEmergencyTypeToApi(type: EmergencyType): ApiAlertType {
  return EMERGENCY_TO_API[type];
}

export function mapApiAlertTypeToEmergency(type: string): EmergencyType {
  return API_TO_EMERGENCY[type] ?? 'other';
}

export function mapApiStatusToAlertStatus(
  status: string,
  hasResponses: boolean
): AlertStatus {
  if (status === 'resolved') return 'resolved';
  if (status === 'cancelled') return 'cancelled';
  if (status === 'active' && hasResponses) return 'responding';
  if (status === 'active') return 'active';
  return 'active';
}

function mapResponseToResponder(item: ApiAlertResponseItem): Responder {
  const status = RESPONSE_TO_STATUS[item.response_type] ?? 'notified';
  return {
    id: item.user_id,
    name: `Responder ${item.user_id.slice(0, 8)}`,
    status,
    etaMinutes: item.eta_minutes ?? undefined,
  };
}

function buildTimelineFromAlert(alert: ApiAlertOut): TimelineEvent[] {
  const events: TimelineEvent[] = [
    {
      id: `created-${alert.id}`,
      timestamp: alert.created_at,
      title: 'SOS alert sent',
      description: 'Your trusted contacts have been notified',
      type: 'system',
    },
  ];

  for (const response of alert.responses) {
    events.push({
      id: response.id,
      timestamp: response.created_at,
      title: responseLabel(response.response_type),
      description:
        response.eta_minutes != null ? `ETA ~${response.eta_minutes} min` : undefined,
      type: 'responder',
    });
  }

  return events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
}

function responseLabel(responseType: string): string {
  const labels: Record<string, string> = {
    i_can_help: 'Someone can help',
    on_my_way: 'Responder is on the way',
    calling_now: 'Responder is calling now',
    unable_to_help: 'Unable to help',
  };
  return labels[responseType] ?? 'New response';
}

export function mapApiAlertToSOSAlert(alert: ApiAlertOut): SOSAlert {
  const responders = alert.responses.map(mapResponseToResponder);
  return {
    id: alert.id,
    userId: alert.created_by,
    type: mapApiAlertTypeToEmergency(alert.alert_type),
    status: mapApiStatusToAlertStatus(alert.status, responders.length > 0),
    createdAt: alert.created_at,
    resolvedAt: alert.resolved_at ?? undefined,
    location: { latitude: alert.latitude, longitude: alert.longitude },
    responders,
    timeline: buildTimelineFromAlert(alert),
    message: alert.message ?? undefined,
  };
}

export function mapApiGroupToGroup(group: ApiGroupOut): Group {
  return {
    id: group.id,
    name: group.name,
    memberCount: group.member_count ?? group.members?.length ?? 0,
    members:
      group.members?.map((member) => ({
        userId: member.user_id,
        displayName: member.full_name,
        email: member.email,
        role: member.role,
      })) ?? [],
    pendingInvites:
      group.pending_invites?.map((invite) => ({
        id: invite.id,
        inviteeEmail: invite.invitee_email,
        inviterName: invite.inviter_name,
        status: invite.status,
        createdAt: invite.created_at,
      })) ?? [],
    myRole: group.my_role ?? undefined,
    isTemporary: group.is_temporary,
    expiresAt: group.expires_at ?? undefined,
  };
}

export function mapApiGroupInvite(invite: ApiGroupInviteOut): GroupInvite {
  return {
    id: invite.id,
    groupId: invite.group_id,
    groupName: invite.group_name,
    inviterName: invite.inviter_name,
    inviteeEmail: invite.invitee_email,
    status: invite.status,
    createdAt: invite.created_at,
  };
}

export function mapApiContactDirectoryItem(item: ApiContactDirectoryItem): CircleContact {
  const email = item.email ?? undefined;
  const userId = item.user_id ?? undefined;
  return {
    id: userId ?? `invite:${email ?? 'unknown'}`,
    userId,
    displayName: item.display_name ?? email ?? 'Invited contact',
    email,
    phone: item.phone ?? undefined,
    groupIds: item.group_ids,
    onPlatform: Boolean(userId),
    status: item.status,
  };
}

export function mapGroupToActivityItem(group: ApiGroupOut): ActivityItem {
  return {
    id: `group-${group.id}`,
    type: 'group_update',
    title: group.name,
    subtitle: group.is_temporary ? 'Temporary group' : 'Trusted group',
    timestamp: group.created_at,
  };
}

export function mapAlertToActivityItem(alert: ApiAlertOut): ActivityItem {
  const emergency = mapApiAlertTypeToEmergency(alert.alert_type);
  const status = mapApiStatusToAlertStatus(alert.status, alert.responses.length > 0);
  return {
    id: `alert-${alert.id}`,
    alertId: alert.id,
    type: 'alert',
    title: `SOS — ${emergency}`,
    subtitle: alert.message ?? 'Emergency alert in your trusted group',
    timestamp: alert.created_at,
    status,
  };
}

export function buildTimelineFromWsEvent(payload: Record<string, unknown>): TimelineEvent | null {
  const type = String(payload.type ?? '');

  if (type === 'alert_response') {
    return {
      id: `ws-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: responseLabel(String(payload.response_type ?? '')),
      description:
        payload.eta_minutes != null ? `ETA ~${payload.eta_minutes} min` : undefined,
      type: 'responder',
    };
  }

  if (type === 'location_update') {
    return {
      id: `loc-${Date.now()}`,
      timestamp: String(payload.recorded_at ?? new Date().toISOString()),
      title: 'Location updated',
      type: 'system',
    };
  }

  if (type === 'alert_resolved') {
    return {
      id: `resolved-${Date.now()}`,
      timestamp: new Date().toISOString(),
      title: 'Alert resolved',
      type: 'system',
    };
  }

  return null;
}

export function mapWsResponseToResponder(payload: Record<string, unknown>): Responder | null {
  if (payload.type !== 'alert_response') return null;
  const userId = String(payload.user_id ?? 'unknown');
  const responseType = String(payload.response_type ?? '');
  const displayName =
    typeof payload.full_name === 'string' && payload.full_name.trim()
      ? payload.full_name
      : `Responder ${userId.slice(0, 8)}`;
  return {
    id: userId,
    name: displayName,
    status: RESPONSE_TO_STATUS[responseType] ?? 'notified',
    etaMinutes:
      typeof payload.eta_minutes === 'number' ? payload.eta_minutes : undefined,
  };
}
