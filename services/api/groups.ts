import type { Group, GroupInvite } from '@/types';
import { authenticatedRequest } from './client';
import { mapApiGroupInvite, mapApiGroupToGroup, type ApiGroupInviteOut, type ApiGroupOut } from './mappers';

export interface CreateGroupParams {
  name: string;
  description?: string;
  isTemporary?: boolean;
  expiresAt?: string;
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
    }),
  });
  return mapApiGroupToGroup(group);
}
