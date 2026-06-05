import type { Group } from '@/types';
import { authenticatedRequest } from './client';
import { mapApiGroupToGroup, type ApiGroupOut } from './mappers';

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
