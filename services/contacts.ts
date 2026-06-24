import type { DeviceContact } from '@/types';
import {
  Contact,
  ContactField,
  ContactsSortOrder,
  getPermissionsAsync,
  PermissionStatus,
  requestPermissionsAsync,
} from 'expo-contacts';
import { Platform } from 'react-native';

const CONTACT_FIELDS = [
  ContactField.FULL_NAME,
  ContactField.GIVEN_NAME,
  ContactField.FAMILY_NAME,
  ContactField.EMAILS,
  ContactField.PHONES,
] as const;

const GET_ALL_BATCH_SIZE = 30;

type ContactDetailsLike = {
  id?: string;
  fullName?: string | null;
  givenName?: string | null;
  familyName?: string | null;
  emails?: { address?: string | null; email?: string | null }[];
  phones?: { number?: string | null }[];
  phoneNumbers?: { number?: string | null }[];
  name?: string;
  firstName?: string;
  lastName?: string;
};

function buildContactName(contact: ContactDetailsLike, emails: string[], phoneNumbers: string[]): string {
  const fromParts = [contact.givenName ?? contact.firstName, contact.familyName ?? contact.lastName]
    .map((part) => part?.trim())
    .filter(Boolean)
    .join(' ');

  return (
    contact.fullName?.trim() ||
    contact.name?.trim() ||
    fromParts ||
    emails[0] ||
    phoneNumbers[0] ||
    'Contact'
  );
}

function mapToDeviceContact(contact: ContactDetailsLike, fallbackKey?: string): DeviceContact {
  const emails =
    contact.emails
      ?.map((entry) => (entry.address ?? entry.email)?.trim().toLowerCase())
      .filter((email): email is string => Boolean(email)) ?? [];
  const phoneNumbers =
    (contact.phones ?? contact.phoneNumbers)
      ?.map((entry) => entry.number?.trim())
      .filter((phone): phone is string => Boolean(phone)) ?? [];

  const name = buildContactName(contact, emails, phoneNumbers);
  const id =
    contact.id?.trim() ||
    (emails[0] ? `email:${emails[0]}` : undefined) ||
    (phoneNumbers[0] ? `phone:${phoneNumbers[0]}` : undefined) ||
    fallbackKey ||
    `contact:${name}`;

  return {
    id,
    name,
    emails: [...new Set(emails)],
    phoneNumbers: [...new Set(phoneNumbers)],
  };
}

function mergeDeviceContacts(sources: DeviceContact[][]): DeviceContact[] {
  const byId = new Map<string, DeviceContact>();

  for (const contacts of sources) {
    for (const contact of contacts) {
      const existing = byId.get(contact.id);
      if (!existing) {
        byId.set(contact.id, contact);
        continue;
      }

      const emails = [...new Set([...existing.emails, ...contact.emails])];
      const phoneNumbers = [...new Set([...existing.phoneNumbers, ...contact.phoneNumbers])];

      byId.set(contact.id, {
        id: contact.id,
        name: existing.name.length >= contact.name.length ? existing.name : contact.name,
        emails,
        phoneNumbers,
      });
    }
  }

  return Array.from(byId.values()).sort((a, b) => a.name.localeCompare(b.name));
}

async function loadFromNewApiBulk(): Promise<DeviceContact[]> {
  const contacts = await Contact.getAllDetails(CONTACT_FIELDS, {
    sortOrder: ContactsSortOrder.GivenName,
  });

  return contacts.map((contact, index) =>
    mapToDeviceContact(contact, `bulk:${index}`)
  );
}

async function loadFromGetAllPath(): Promise<DeviceContact[]> {
  const contacts = await Contact.getAll({
    sortOrder: ContactsSortOrder.GivenName,
  });

  if (contacts.length === 0) {
    return [];
  }

  const rows: DeviceContact[] = [];

  for (let index = 0; index < contacts.length; index += GET_ALL_BATCH_SIZE) {
    const batch = contacts.slice(index, index + GET_ALL_BATCH_SIZE);
    const batchRows = await Promise.all(
      batch.map(async (contact) => {
        try {
          const details = await contact.getDetails(CONTACT_FIELDS);
          return mapToDeviceContact({ ...details, id: contact.id }, contact.id);
        } catch {
          return mapToDeviceContact({ id: contact.id }, contact.id);
        }
      })
    );
    rows.push(...batchRows);
  }

  return rows;
}

async function loadFromLegacyApi(): Promise<DeviceContact[]> {
  const { getContactsAsync, Fields, SortTypes } = await import('expo-contacts/legacy');
  const response = await getContactsAsync({
    fields: [
      Fields.Emails,
      Fields.PhoneNumbers,
      Fields.Name,
      Fields.FirstName,
      Fields.LastName,
    ],
    sort: SortTypes.FirstName,
    pageSize: 0,
  });

  const contacts = response.data.map((contact, index) =>
    mapToDeviceContact(contact, `legacy:${index}`)
  );

  return mergeDeviceContacts([contacts]);
}

async function loadFromLegacyApiAllFields(): Promise<DeviceContact[]> {
  const { getContactsAsync, SortTypes } = await import('expo-contacts/legacy');
  const response = await getContactsAsync({
    sort: SortTypes.FirstName,
    pageSize: 0,
  });

  return response.data.map((contact, index) =>
    mapToDeviceContact(contact, `legacy-all:${index}`)
  );
}

async function runContactLoadStrategy(
  loader: () => Promise<DeviceContact[]>
): Promise<DeviceContact[]> {
  try {
    return await loader();
  } catch {
    return [];
  }
}

export async function getContactsPermissionStatus(): Promise<PermissionStatus> {
  const { status } = await getPermissionsAsync();
  return status;
}

export async function requestContactsPermission(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const current = await getPermissionsAsync();
  if (current.status === PermissionStatus.GRANTED) {
    return true;
  }

  const { status } = await requestPermissionsAsync();
  return status === PermissionStatus.GRANTED;
}

export async function deviceContactCount(): Promise<number> {
  if (Platform.OS === 'web') return 0;

  try {
    return await Contact.getCount();
  } catch {
    try {
      const { hasContactsAsync } = await import('expo-contacts/legacy');
      return (await hasContactsAsync()) ? 1 : 0;
    } catch {
      return 0;
    }
  }
}

export async function deviceHasContacts(): Promise<boolean> {
  const count = await deviceContactCount();
  return count > 0;
}

export async function pickDeviceContact(): Promise<DeviceContact | null> {
  if (Platform.OS === 'web') return null;

  const granted = await requestContactsPermission();
  if (!granted) return null;

  const picked = await Contact.presentPicker();
  if (!picked) return null;

  try {
    const details = await picked.getDetails(CONTACT_FIELDS);
    return mapToDeviceContact({ ...details, id: picked.id });
  } catch {
    return mapToDeviceContact({ id: picked.id }, picked.id);
  }
}

export async function loadDeviceContacts(): Promise<DeviceContact[]> {
  if (Platform.OS === 'web') return [];

  const granted = await requestContactsPermission();
  if (!granted) return [];

  const primary = await runContactLoadStrategy(loadFromNewApiBulk);
  if (primary.length > 0) {
    return primary;
  }

  const fallback = await runContactLoadStrategy(loadFromGetAllPath);
  if (fallback.length > 0) {
    return fallback;
  }

  const legacy = await runContactLoadStrategy(loadFromLegacyApi);
  return legacy.length > 0 ? legacy : runContactLoadStrategy(loadFromLegacyApiAllFields);
}
