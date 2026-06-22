import { matchContactsByPhone } from '@/services/api/contacts';
import { lookupUsersByEmail } from '@/services/api/users';
import {
  deviceContactCount,
  loadDeviceContacts,
  requestContactsPermission,
} from '@/services/contacts';
import { ApiError } from '@/services/api/client';
import { normalizePhoneE164 } from '@/services/phone';
import { useAuthStore } from '@/stores/authStore';
import type { DeviceContact } from '@/types';
import { useQuery } from '@tanstack/react-query';

export type DeviceContactRow = DeviceContact & {
  primaryEmail?: string;
  /** Registered YouHoo Alert email (from lookup), used for group invites */
  accountEmail?: string;
  /** Email to use when sending a group invite */
  inviteEmail?: string;
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
  const emailMatches = emails.length > 0 ? await lookupUsersInBatches(emails) : [];
  const matchByEmail = new Map(emailMatches.map((match) => [match.email.toLowerCase(), match]));

  const phoneVerified = useAuthStore.getState().user?.phoneVerified;
  const phoneMatchByLast4 = new Map<
    string,
    { user_id: string; display_name: string; email: string }
  >();

  if (phoneVerified) {
    const phoneEntries = contacts.flatMap((contact) =>
      contact.phoneNumbers
        .map((phone) => normalizePhoneE164(phone))
        .filter((phone): phone is string => Boolean(phone))
        .map((phone) => ({ phone, displayName: contact.name }))
    );

    if (phoneEntries.length > 0) {
      try {
        const uniqueByPhone = new Map(phoneEntries.map((entry) => [entry.phone, entry]));
        const response = await matchContactsByPhone([...uniqueByPhone.values()]);
        for (const match of response.matched_users) {
          phoneMatchByLast4.set(match.phone_last4, {
            user_id: match.user_id,
            display_name: match.display_name,
            email: match.email,
          });
        }
      } catch {
        // Fall back to email-only matching if phone match is unavailable.
      }
    }
  }

  return contacts.map((contact) => {
    const matchedEmail = contact.emails.find((email) =>
      matchByEmail.has(email.trim().toLowerCase())
    );
    const emailMatch = matchedEmail
      ? matchByEmail.get(matchedEmail.trim().toLowerCase())
      : undefined;

    const normalizedPhones = contact.phoneNumbers
      .map((phone) => normalizePhoneE164(phone))
      .filter((phone): phone is string => Boolean(phone));

    const phoneUser = normalizedPhones
      .map((phone) => phoneMatchByLast4.get(phone.slice(-4)))
      .find(
        (match): match is { user_id: string; display_name: string; email: string } =>
          Boolean(match)
      );

    const primaryEmail = contact.emails[0];
    const accountEmail = emailMatch?.email ?? phoneUser?.email;
    const inviteEmail = accountEmail ?? primaryEmail?.trim().toLowerCase();
    const onPlatform = Boolean(emailMatch || phoneUser);

    return {
      ...contact,
      primaryEmail,
      accountEmail,
      inviteEmail,
      onPlatform,
      userId: emailMatch?.user_id ?? phoneUser?.user_id,
      canReach: Boolean(inviteEmail || contact.phoneNumbers[0]),
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
