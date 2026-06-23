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

export async function matchContactsByPhone(
  contacts: { phone: string; displayName?: string }[],
  countryCode = 'IE'
) {
  return authenticatedRequest<{
    matched_users: {
      user_id: string;
      display_name: string;
      email: string;
      phone_last4: string;
      is_trusted: boolean;
      contact_label?: string | null;
    }[];
    unmatched_contacts: { phone_last4: string; display_name?: string | null }[];
    existing_trusted_contact_ids: string[];
  }>('/contacts/match', {
    method: 'POST',
    body: JSON.stringify({
      contacts: contacts.map((c) => ({
        phone: c.phone,
        display_name: c.displayName,
      })),
      country_code: countryCode,
    }),
  });
}

export async function addTrustedContact(contactUserId: string, displayName?: string) {
  await authenticatedRequest('/contacts/add', {
    method: 'POST',
    body: JSON.stringify({
      contact_user_id: contactUserId,
      display_name: displayName,
    }),
  });
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
        'Could not update circles. Please update the app and try again.',
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
        'Could not send circle invitations. Please update the app and try again.',
        404,
        'not_found'
      );
    }
    throw error;
  }
}
