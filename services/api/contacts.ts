import type { CircleContact, Group } from '@/types';
import { ApiError } from './client';
import { authenticatedRequest } from './client';
import {
  mapApiContactDirectoryItem,
  type ApiContactDirectoryItem,
} from './mappers';

interface ContactDirectoryResponse {
  contacts: ApiContactDirectoryItem[];
}

function buildDirectoryFromGroups(groups: Group[]): CircleContact[] {
  const byUser = new Map<string, CircleContact>();

  for (const group of groups) {
    for (const member of group.members) {
      const existing = byUser.get(member.userId);
      if (existing) {
        if (!existing.groupIds.includes(group.id)) {
          existing.groupIds.push(group.id);
        }
        continue;
      }
      byUser.set(member.userId, {
        id: member.userId,
        userId: member.userId,
        displayName: member.displayName,
        email: member.email,
        groupIds: [group.id],
        onPlatform: true,
        status: 'member',
      });
    }
  }

  return Array.from(byUser.values()).sort((a, b) =>
    a.displayName.localeCompare(b.displayName)
  );
}

export async function fetchContactDirectory(groups?: Group[]): Promise<CircleContact[]> {
  try {
    const response = await authenticatedRequest<ContactDirectoryResponse>('/contacts/directory');
    return response.contacts.map(mapApiContactDirectoryItem);
  } catch (error) {
    if (error instanceof ApiError && error.status === 404 && groups) {
      return buildDirectoryFromGroups(groups);
    }
    throw error;
  }
}

export async function setContactGroups(userId: string, groupIds: string[]): Promise<void> {
  try {
    await authenticatedRequest(`/contacts/${userId}/groups`, {
      method: 'PUT',
      body: JSON.stringify({ group_ids: groupIds }),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new ApiError(
        'Update the API on Railway to assign contacts to multiple circles.',
        404,
        'not_found'
      );
    }
    throw error;
  }
}

export async function assignInviteToGroups(email: string, groupIds: string[]): Promise<void> {
  try {
    await authenticatedRequest('/contacts/invites/groups', {
      method: 'POST',
      body: JSON.stringify({ email, group_ids: groupIds }),
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) {
      throw new ApiError(
        'Update the API on Railway to invite contacts to multiple circles.',
        404,
        'not_found'
      );
    }
    throw error;
  }
}
