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
  ContactField.EMAILS,
  ContactField.PHONES,
] as const;

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

export async function loadDeviceContacts(): Promise<DeviceContact[]> {
  if (Platform.OS === 'web') return [];

  const granted = await requestContactsPermission();
  if (!granted) return [];

  const contacts = await Contact.getAllDetails(CONTACT_FIELDS, {
    sortOrder: ContactsSortOrder.GivenName,
  });

  return contacts
    .map((contact) => {
      const emails =
        contact.emails
          ?.map((entry) => entry.address?.trim().toLowerCase())
          .filter((email): email is string => Boolean(email)) ?? [];
      const phoneNumbers =
        contact.phones
          ?.map((entry) => entry.number?.trim())
          .filter((phone): phone is string => Boolean(phone)) ?? [];
      const name = contact.fullName?.trim() || emails[0] || phoneNumbers[0] || 'Contact';

      return {
        id: contact.id,
        name,
        emails: [...new Set(emails)],
        phoneNumbers: [...new Set(phoneNumbers)],
      };
    })
    .filter((contact) => contact.emails.length > 0 || contact.phoneNumbers.length > 0);
}
