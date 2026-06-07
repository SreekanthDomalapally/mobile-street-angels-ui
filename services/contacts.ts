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

function mapToDeviceContact(contact: ContactDetailsLike): DeviceContact | null {
  const emails =
    contact.emails
      ?.map((entry) => (entry.address ?? entry.email)?.trim().toLowerCase())
      .filter((email): email is string => Boolean(email)) ?? [];
  const phoneNumbers =
    (contact.phones ?? contact.phoneNumbers)
      ?.map((entry) => entry.number?.trim())
      .filter((phone): phone is string => Boolean(phone)) ?? [];

  const id = contact.id?.trim();
  if (!id) return null;

  return {
    id,
    name: buildContactName(contact, emails, phoneNumbers),
    emails: [...new Set(emails)],
    phoneNumbers: [...new Set(phoneNumbers)],
  };
}

async function loadFromNewApi(): Promise<DeviceContact[]> {
  const contacts = await Contact.getAllDetails(CONTACT_FIELDS, {
    sortOrder: ContactsSortOrder.GivenName,
  });

  return contacts
    .map((contact) => mapToDeviceContact(contact))
    .filter((contact): contact is DeviceContact => contact !== null);
}

async function loadFromLegacyApi(): Promise<DeviceContact[]> {
  const { getContactsAsync, Fields, SortTypes } = await import('expo-contacts/legacy');
  const { data } = await getContactsAsync({
    fields: [Fields.Emails, Fields.PhoneNumbers, Fields.Name, Fields.FirstName, Fields.LastName],
    sort: SortTypes.FirstName,
  });

  return data
    .map((contact) => mapToDeviceContact(contact))
    .filter((contact): contact is DeviceContact => contact !== null);
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

export async function deviceHasContacts(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  try {
    return await Contact.hasAny();
  } catch {
    try {
      const { hasContactsAsync } = await import('expo-contacts/legacy');
      return await hasContactsAsync();
    } catch {
      return false;
    }
  }
}

export async function pickDeviceContact(): Promise<DeviceContact | null> {
  if (Platform.OS === 'web') return null;

  const granted = await requestContactsPermission();
  if (!granted) return null;

  const picked = await Contact.presentPicker();
  if (!picked) return null;

  try {
    const details = await picked.getDetails(CONTACT_FIELDS);
    const mapped = mapToDeviceContact({ ...details, id: picked.id });
    if (mapped) return mapped;
    return {
      id: picked.id,
      name: buildContactName({ ...details, id: picked.id }, [], []),
      emails: [],
      phoneNumbers: [],
    };
  } catch {
    const legacy = await loadFromLegacyApi();
    const match = legacy.find((contact) => contact.id === picked.id);
    if (match) return match;
    return {
      id: picked.id,
      name: 'Contact',
      emails: [],
      phoneNumbers: [],
    };
  }
}

export async function loadDeviceContacts(): Promise<DeviceContact[]> {
  if (Platform.OS === 'web') return [];

  const granted = await requestContactsPermission();
  if (!granted) return [];

  try {
    const fromNewApi = await loadFromNewApi();
    if (fromNewApi.length > 0) {
      return fromNewApi;
    }
  } catch {
    // Fall back to the legacy contacts API below.
  }

  return loadFromLegacyApi();
}
