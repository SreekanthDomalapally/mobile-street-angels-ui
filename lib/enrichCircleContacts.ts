import AsyncStorage from '@react-native-async-storage/async-storage';
import { loadDeviceContacts, requestContactsPermission } from '@/services/contacts';
import { formatPhoneForDisplay, normalizePhoneE164 } from '@/services/phone';
import type { CircleContact, GroupPendingInvite } from '@/types';

const CACHE_KEY = 'street-angels-invite-contact-names';

function isGenericDisplayName(name: string, contact: CircleContact): boolean {
  const trimmed = name.trim();
  if (!trimmed || trimmed === 'Invited contact') return true;
  if (contact.email && trimmed.toLowerCase() === contact.email.toLowerCase()) return true;
  if (contact.phone && trimmed === contact.phone) return true;
  return false;
}

/** Recover E.164 from placeholder emails like `353892638402@phone.pending`. */
export function phoneFromPendingInviteEmail(email: string | undefined | null): string | null {
  if (!email) return null;
  const match = email.trim().match(/^(\+?\d{6,15})@phone\.pending$/i);
  if (!match) return null;
  const digits = match[1].startsWith('+') ? match[1] : `+${match[1]}`;
  return normalizePhoneE164(digits) ?? normalizePhoneE164(match[1]);
}

export function resolvePendingInvitePhone(invite: GroupPendingInvite): string | null {
  if (invite.inviteePhone) {
    return normalizePhoneE164(invite.inviteePhone) ?? invite.inviteePhone;
  }
  return phoneFromPendingInviteEmail(invite.inviteeEmail);
}

export type ResolvedPendingInvite = GroupPendingInvite & {
  displayName: string;
  subtitle: string;
};

/** Resolve pending invite labels from phone-book + invite-name cache. */
export async function enrichPendingInvites(
  invites: GroupPendingInvite[],
): Promise<ResolvedPendingInvite[]> {
  if (invites.length === 0) return [];

  const phoneNames = await buildPhoneNameMap();

  return invites.map((invite) => {
    const phone = resolvePendingInvitePhone(invite);
    const fromPhoneBook = phone ? phoneNames.get(phone) : undefined;
    const email = invite.inviteeEmail.trim();
    const isPhonePlaceholder = email.toLowerCase().endsWith('@phone.pending');

    const displayName =
      fromPhoneBook ??
      (!isPhonePlaceholder && email ? email : null) ??
      (phone ? formatPhoneForDisplay(phone) : null) ??
      'Invited contact';

    const subtitle = phone
      ? formatPhoneForDisplay(phone)
      : isPhonePlaceholder
        ? 'Phone invite'
        : email;

    return {
      ...invite,
      displayName,
      subtitle,
    };
  });
}

async function loadInviteNameCache(): Promise<Map<string, string>> {
  try {
    const raw = await AsyncStorage.getItem(CACHE_KEY);
    if (!raw) return new Map();
    const parsed = JSON.parse(raw) as Record<string, string>;
    return new Map(Object.entries(parsed));
  } catch {
    return new Map();
  }
}

async function buildPhoneNameMap(): Promise<Map<string, string>> {
  const map = await loadInviteNameCache();
  const granted = await requestContactsPermission();
  if (!granted) return map;

  const contacts = await loadDeviceContacts().catch(() => []);
  for (const contact of contacts) {
    const name = contact.name.trim();
    if (!name) continue;
    for (const phone of contact.phoneNumbers) {
      const e164 = normalizePhoneE164(phone);
      if (e164) {
        map.set(e164, name);
      }
    }
  }
  return map;
}

/** Remember a contact label when inviting by phone (survives app restarts). */
export async function saveInviteContactName(phone: string, name: string): Promise<void> {
  const e164 = normalizePhoneE164(phone);
  const trimmed = name.trim();
  if (!e164 || !trimmed) return;

  const map = await loadInviteNameCache();
  map.set(e164, trimmed);
  await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(Object.fromEntries(map)));
}

/** Fill in real names for pending invites using the phone book + local invite cache. */
export async function enrichCircleContacts(contacts: CircleContact[]): Promise<CircleContact[]> {
  const needsEnrichment = contacts.some((contact) =>
    isGenericDisplayName(contact.displayName, contact)
  );
  if (!needsEnrichment) return contacts;

  const phoneNames = await buildPhoneNameMap();

  return contacts.map((contact) => {
    if (!isGenericDisplayName(contact.displayName, contact)) {
      return contact;
    }

    const phone = contact.phone ? normalizePhoneE164(contact.phone) : null;
    if (phone) {
      const fromPhoneBook = phoneNames.get(phone);
      if (fromPhoneBook) {
        return { ...contact, displayName: fromPhoneBook };
      }
    }

    return contact;
  });
}
