import type { TrustedContactRelationship, TrustedContactStatus } from '@/types';
import { ApiError } from './client';
import { authenticatedRequest } from './client';
import { addTrustedContact, fetchContactDirectory } from './contacts';
import { fetchGroups } from './groups';
import { fetchGroupWithMembers } from './groupMembers';

interface ApiTrustedContactOut {
  id: string;
  user_id?: string | null;
  display_name: string;
  email?: string | null;
  phone?: string | null;
  status: string;
  is_incoming?: boolean;
}

function mapStatus(status: string): TrustedContactStatus {
  const normalized = status.toLowerCase();
  if (normalized === 'invited') return 'invited';
  if (normalized === 'pending') return 'pending';
  if (normalized === 'accepted') return 'accepted';
  if (normalized === 'blocked') return 'blocked';
  if (normalized === 'removed') return 'removed';
  return 'pending';
}

function mapTrusted(item: ApiTrustedContactOut): TrustedContactRelationship {
  return {
    id: item.id,
    userId: item.user_id ?? undefined,
    displayName: item.display_name,
    email: item.email ?? undefined,
    phone: item.phone ?? undefined,
    status: mapStatus(item.status),
    isIncoming: Boolean(item.is_incoming),
  };
}

async function fetchTrustedFromDirectory(): Promise<TrustedContactRelationship[]> {
  const groups = await fetchGroups();
  const detailed = await Promise.all(groups.map((group) => fetchGroupWithMembers(group.id)));
  const directory = await fetchContactDirectory(detailed);

  return directory
    .filter((contact) => contact.onPlatform && contact.userId)
    .map((contact) => ({
      id: contact.userId!,
      userId: contact.userId,
      displayName: contact.displayName,
      email: contact.email,
      phone: contact.phone,
      status: contact.status === 'member' ? ('accepted' as const) : ('pending' as const),
    }));
}

export async function fetchTrustedContacts(): Promise<TrustedContactRelationship[]> {
  try {
    const response = await authenticatedRequest<{ contacts: ApiTrustedContactOut[] }>(
      '/contacts/trusted'
    );
    return response.contacts.map(mapTrusted);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 501)) {
      return fetchTrustedFromDirectory();
    }
    throw error;
  }
}

export async function sendTrustedContactRequest(
  contactUserId: string,
  displayName?: string
): Promise<void> {
  try {
    await authenticatedRequest('/contacts/trusted', {
      method: 'POST',
      body: JSON.stringify({ contact_user_id: contactUserId, display_name: displayName }),
    });
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 501)) {
      await addTrustedContact(contactUserId, displayName);
      return;
    }
    throw error;
  }
}

export async function acceptTrustedContactRequest(relationshipId: string): Promise<void> {
  await authenticatedRequest(`/contacts/trusted/${relationshipId}/accept`, { method: 'POST' });
}

export async function declineTrustedContactRequest(relationshipId: string): Promise<void> {
  await authenticatedRequest(`/contacts/trusted/${relationshipId}/decline`, { method: 'POST' });
}

export async function countAcceptedTrustedContacts(): Promise<number> {
  const contacts = await fetchTrustedContacts();
  return contacts.filter((contact) => contact.status === 'accepted').length;
}
