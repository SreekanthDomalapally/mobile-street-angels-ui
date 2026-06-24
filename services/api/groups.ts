import type { EmergencyType, Group, GroupInvite } from '@/types';
import { authenticatedRequest } from './client';
import { mapApiGroupInvite, mapApiGroupToGroup, type ApiGroupInviteOut, type ApiGroupOut } from './mappers';

export interface CreateGroupParams {
  name: string;
  description?: string;
  isTemporary?: boolean;
  expiresAt?: string;
  priority?: number;
  visibility?: string;
  emergencyTypes?: EmergencyType[];
}

export async function fetchGroups(): Promise<Group[]> {
  const groups = await authenticatedRequest<ApiGroupOut[]>('/groups');
  return groups.map(mapApiGroupToGroup);
}

export async function fetchGroup(groupId: string): Promise<Group> {
  const group = await authenticatedRequest<ApiGroupOut>(`/groups/${groupId}`);
  return mapApiGroupToGroup(group);
}

export async function addGroupMember(
  groupId: string,
  userId: string,
  role: 'owner' | 'admin' | 'member' = 'member'
): Promise<void> {
  await authenticatedRequest(`/groups/${groupId}/members`, {
    method: 'POST',
    body: JSON.stringify({ user_id: userId, role }),
  });
}

export async function removeGroupMember(groupId: string, userId: string): Promise<void> {
  await authenticatedRequest(`/groups/${groupId}/members/${userId}`, {
    method: 'DELETE',
  });
}

export async function inviteToGroup(
  groupId: string,
  target:
    | { inviteeEmail: string }
    | { inviteePhone: string; countryCode?: string }
    | { userId: string }
): Promise<void> {
  const body =
    'userId' in target
      ? { user_id: target.userId }
      : 'inviteePhone' in target
        ? {
            invitee_phone: target.inviteePhone,
            country_code: target.countryCode ?? 'IE',
          }
        : { invitee_email: target.inviteeEmail };

  await authenticatedRequest(`/groups/${groupId}/invites`, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export async function fetchMyGroupInvites(): Promise<GroupInvite[]> {
  const invites = await authenticatedRequest<ApiGroupInviteOut[]>('/groups/invites/mine');
  return invites.map(mapApiGroupInvite);
}

export async function acceptGroupInvite(inviteId: string): Promise<void> {
  await authenticatedRequest(`/groups/invites/${inviteId}/accept`, { method: 'POST' });
}

export async function declineGroupInvite(inviteId: string): Promise<void> {
  await authenticatedRequest(`/groups/invites/${inviteId}/decline`, { method: 'POST' });
}

export async function createGroup(params: CreateGroupParams): Promise<Group> {
  const group = await authenticatedRequest<ApiGroupOut>('/groups', {
    method: 'POST',
    body: JSON.stringify({
      name: params.name,
      description: params.description,
      is_temporary: params.isTemporary ?? false,
      expires_at: params.expiresAt,
      ...(params.priority !== undefined ? { priority: params.priority } : {}),
      ...(params.visibility !== undefined ? { visibility: params.visibility } : {}),
      ...(params.emergencyTypes !== undefined ? { emergency_types: params.emergencyTypes } : {}),
    }),
  });
  return mapApiGroupToGroup(group);
}

export interface UpdateGroupParams {
  name?: string;
  description?: string;
  priority?: number;
  visibility?: string;
}

export async function updateGroup(groupId: string, params: UpdateGroupParams): Promise<Group> {
  const group = await authenticatedRequest<ApiGroupOut>(`/groups/${groupId}`, {
    method: 'PATCH',
    body: JSON.stringify({
      ...(params.name !== undefined ? { name: params.name } : {}),
      ...(params.description !== undefined ? { description: params.description } : {}),
      ...(params.priority !== undefined ? { priority: params.priority } : {}),
      ...(params.visibility !== undefined ? { visibility: params.visibility } : {}),
    }),
  });
  return mapApiGroupToGroup(group);
}

export async function fetchGroupEmergencyTypes(groupId: string): Promise<EmergencyType[]> {
  const types = await authenticatedRequest<string[]>(`/groups/${groupId}/emergency-types`);
  return types as EmergencyType[];
}

export async function setGroupEmergencyTypes(
  groupId: string,
  emergencyTypes: EmergencyType[]
): Promise<EmergencyType[]> {
  const types = await authenticatedRequest<string[]>(`/groups/${groupId}/emergency-types`, {
    method: 'PUT',
    body: JSON.stringify({ emergency_types: emergencyTypes }),
  });
  return types as EmergencyType[];
}
