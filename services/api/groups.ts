import type { Group } from '@/types';
import { mockGroups } from '@/data/mock';
import { delay } from '@/lib/utils';
import { apiRequest } from './client';

export async function getGroups(token?: string): Promise<Group[]> {
  try {
    return await apiRequest<Group[]>('/groups', { token });
  } catch {
    await delay(400);
    return mockGroups;
  }
}

export async function createGroup(
  name: string,
  memberIds: string[],
  isTemporary?: boolean,
  token?: string
): Promise<Group> {
  try {
    return await apiRequest<Group>('/groups', {
      method: 'POST',
      token,
      body: JSON.stringify({ name, memberIds, isTemporary }),
    });
  } catch {
    await delay(500);
    return {
      id: `g-${Date.now()}`,
      name,
      memberCount: memberIds.length,
      members: [],
      isTemporary,
    };
  }
}
