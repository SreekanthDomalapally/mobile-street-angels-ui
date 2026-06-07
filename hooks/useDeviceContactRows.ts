import { lookupUsersByEmail } from '@/services/api/users';
import {
  deviceContactCount,
  loadDeviceContacts,
  requestContactsPermission,
} from '@/services/contacts';
import { ApiError } from '@/services/api/client';
import type { DeviceContact } from '@/types';
import { useQuery } from '@tanstack/react-query';

export type DeviceContactRow = DeviceContact & {
  primaryEmail?: string;
  onPlatform: boolean;
  userId?: string;
  canReach: boolean;
};

const LOOKUP_BATCH_SIZE = 50;

async function lookupUsersInBatches(emails: string[]) {
  const unique = [...new Set(emails.map((email) => email.trim().toLowerCase()).filter(Boolean))];
  const matches: Awaited<ReturnType<typeof lookupUsersByEmail>> = [];

  for (let index = 0; index < unique.length; index += LOOKUP_BATCH_SIZE) {
    const batch = unique.slice(index, index + LOOKUP_BATCH_SIZE);
    try {
      const batchMatches = await lookupUsersByEmail(batch);
      matches.push(...batchMatches);
    } catch {
      // Keep showing contacts even if lookup fails for a batch.
    }
  }

  return matches;
}

async function enrichContacts(contacts: DeviceContact[]): Promise<DeviceContactRow[]> {
  const emails = contacts.flatMap((contact) => contact.emails);
  const matches = emails.length > 0 ? await lookupUsersInBatches(emails) : [];
  const matchByEmail = new Map(matches.map((match) => [match.email.toLowerCase(), match]));

  return contacts.map((contact) => {
    const matchedEmail = contact.emails.find((email) => matchByEmail.has(email));
    const match = matchedEmail ? matchByEmail.get(matchedEmail) : undefined;
    const primaryEmail = matchedEmail ?? contact.emails[0];
    return {
      ...contact,
      primaryEmail,
      onPlatform: Boolean(match),
      userId: match?.user_id,
      canReach: Boolean(primaryEmail || contact.phoneNumbers[0]),
    };
  });
}

async function fetchDeviceContactRows(): Promise<{
  rows: DeviceContactRow[];
  permissionDenied: boolean;
  addressBookEmpty: boolean;
  loadFailed: boolean;
  deviceContactCount: number;
}> {
  const granted = await requestContactsPermission();
  if (!granted) {
    return {
      rows: [],
      permissionDenied: true,
      addressBookEmpty: false,
      loadFailed: false,
      deviceContactCount: 0,
    };
  }

  const [contacts, count] = await Promise.all([
    loadDeviceContacts().catch(() => [] as DeviceContact[]),
    deviceContactCount(),
  ]);

  const rows = await enrichContacts(contacts);

  return {
    rows,
    permissionDenied: false,
    addressBookEmpty: count === 0 && rows.length === 0,
    loadFailed: count > 0 && rows.length === 0,
    deviceContactCount: count,
  };
}

export function useDeviceContactRows(enabled = true) {
  const query = useQuery({
    queryKey: ['device-contacts'],
    queryFn: fetchDeviceContactRows,
    enabled,
    retry: 1,
    staleTime: 0,
  });

  return {
    rows: query.data?.rows ?? [],
    loading: query.isLoading,
    error:
      query.error instanceof ApiError
        ? query.error.message
        : query.error
          ? 'Could not load contacts.'
          : null,
    permissionDenied: query.data?.permissionDenied ?? false,
    addressBookEmpty: query.data?.addressBookEmpty ?? false,
    loadFailed: query.data?.loadFailed ?? false,
    deviceContactCount: query.data?.deviceContactCount ?? 0,
    reload: () => query.refetch(),
  };
}
