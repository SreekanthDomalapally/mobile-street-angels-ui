import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useDeviceContactRows, type DeviceContactRow } from '@/hooks/useDeviceContactRows';
import { ApiError } from '@/services/api/client';
import { normalizePhoneE164 } from '@/services/phone';
import { inviteContactToGroup } from '@/services/groupContactActions';
import { useAuthStore } from '@/stores/authStore';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Platform, TextInput, View } from 'react-native';

interface GroupContactListProps {
  groupId: string;
  groupName?: string;
  memberEmails?: string[];
  pendingEmails?: string[];
  pendingPhones?: string[];
  onUpdated: () => void;
}

function contactSubtitle(row: DeviceContactRow): string {
  if (row.primaryEmail && row.phoneNumbers[0]) {
    return `${row.primaryEmail} · ${row.phoneNumbers[0]}`;
  }
  return row.primaryEmail ?? row.phoneNumbers[0] ?? 'No email or phone';
}

type ContactStatus = 'member' | 'pending' | 'add' | 'invite';

function resolveStatus(
  row: DeviceContactRow,
  memberSet: Set<string>,
  pendingEmailSet: Set<string>,
  pendingPhoneSet: Set<string>
): ContactStatus {
  const emails = [
    row.inviteEmail,
    row.accountEmail,
    ...row.emails.map((email) => email.trim().toLowerCase()),
  ].filter(
    (email): email is string =>
      Boolean(email) && typeof email === 'string' && !email.endsWith('@phone.pending')
  );

  if (emails.some((email) => memberSet.has(email))) {
    return 'member';
  }
  if (emails.some((email) => pendingEmailSet.has(email))) {
    return 'pending';
  }

  const normalizedPhones = row.phoneNumbers
    .map((phone) => normalizePhoneE164(phone))
    .filter((phone): phone is string => Boolean(phone));

  if (normalizedPhones.some((phone) => pendingPhoneSet.has(phone))) {
    return 'pending';
  }

  return row.onPlatform ? 'add' : 'invite';
}

export function GroupContactList({
  groupId,
  groupName,
  memberEmails = [],
  pendingEmails = [],
  pendingPhones = [],
  onUpdated,
}: GroupContactListProps) {
  const {
    rows,
    loading,
    error,
    permissionDenied,
    addressBookEmpty,
    loadFailed,
    reload,
  } = useDeviceContactRows(Boolean(groupId));

  useFocusEffect(
    useCallback(() => {
      if (groupId) {
        reload();
      }
    }, [groupId, reload])
  );
  const [search, setSearch] = useState('');
  const [actionError, setActionError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [localPendingEmails, setLocalPendingEmails] = useState<Set<string>>(new Set());
  const [localPendingPhones, setLocalPendingPhones] = useState<Set<string>>(new Set());

  const memberSet = useMemo(
    () => new Set(memberEmails.map((email) => email.toLowerCase())),
    [memberEmails]
  );
  const pendingEmailSet = useMemo(() => {
    const merged = new Set(
      pendingEmails
        .map((email) => email.toLowerCase())
        .filter((email) => !email.endsWith('@phone.pending'))
    );
    localPendingEmails.forEach((email) => merged.add(email));
    return merged;
  }, [pendingEmails, localPendingEmails]);
  const pendingPhoneSet = useMemo(() => {
    const merged = new Set(pendingPhones.filter(Boolean));
    localPendingPhones.forEach((phone) => merged.add(phone));
    return merged;
  }, [pendingPhones, localPendingPhones]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(query) ||
        row.emails.some((email) => email.includes(query)) ||
        row.phoneNumbers.some((phone) => phone.includes(query))
    );
  }, [rows, search]);

  const inviterName = useAuthStore((s) => s.user?.displayName ?? 'A friend');

  const inviteToGroupWithContext = (row: DeviceContactRow) =>
    inviteContactToGroup(
      {
        displayName: row.name,
        email: row.inviteEmail ?? row.primaryEmail,
        phone: row.phoneNumbers[0],
        userId: row.userId,
      },
      groupId,
      { inviterName, groupName: groupName ?? 'your circle' }
    );

  const markPending = (row: DeviceContactRow) => {
    const email = row.inviteEmail?.toLowerCase();
    if (email && !email.endsWith('@phone.pending')) {
      setLocalPendingEmails((current) => new Set([...current, email]));
    }
    const phone = row.phoneNumbers
      .map((value) => normalizePhoneE164(value))
      .find((value): value is string => Boolean(value));
    if (phone) {
      setLocalPendingPhones((current) => new Set([...current, phone]));
    }
  };

  const handleAdd = async (row: DeviceContactRow) => {
    if (!row.userId && !row.inviteEmail) {
      setActionError('Could not resolve this contact’s YouHoo Alert account.');
      return;
    }

    setBusyId(row.id);
    setActionError(null);
    try {
      await inviteToGroupWithContext(row);
      markPending(row);
      onUpdated();
      await reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not send group request.');
    } finally {
      setBusyId(null);
    }
  };

  const handleInvite = async (row: DeviceContactRow) => {
    if (!row.canReach) {
      setActionError('Add an email or phone number to invite this contact.');
      return;
    }

    setBusyId(row.id);
    setActionError(null);
    try {
      await inviteToGroupWithContext(row);
      markPending(row);
      onUpdated();
      await reload();
    } catch (err) {
      setActionError(err instanceof ApiError ? err.message : 'Could not send invite.');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) {
    return (
      <View className="items-center py-12">
        <ActivityIndicator color="#6bb892" />
        <Text variant="caption" muted className="mt-3">
          Loading contacts…
        </Text>
      </View>
    );
  }

  return (
    <View>
      <Text variant="label" className="mb-2">
        {groupName ? `Invite people to ${groupName}` : 'Invite people'}
      </Text>
      <Text variant="caption" muted className="mb-3">
        Send a request to YouHoo Alert users. They must accept before joining the group.
      </Text>

      <TextInput
        className="mb-4 min-h-[48px] rounded-2xl border border-glass-border bg-charcoal-900 px-4 text-base text-white"
        placeholder="Search contacts"
        placeholderTextColor="#6d6d75"
        value={search}
        onChangeText={setSearch}
      />

      {permissionDenied && (
        <Text variant="body" muted className="mb-4">
          Allow contacts access in Settings to see people from your phone.
        </Text>
      )}

      {error && (
        <Text variant="caption" className="mb-3 text-emergency">
          {error}
        </Text>
      )}

      {actionError && (
        <Text variant="caption" className="mb-3 text-emergency">
          {actionError}
        </Text>
      )}

      {filtered.length === 0 ? (
        <View className="items-center py-6">
          <Text variant="body" muted className="text-center">
            {rows.length > 0
              ? 'No contacts match your search.'
              : permissionDenied
                ? 'Allow contacts access in Settings to see people from your phone.'
                : loadFailed
                  ? 'Contacts are on this device but could not be read. Tap Reload to try again.'
                  : addressBookEmpty
                    ? Platform.OS === 'android'
                      ? 'No contacts found. Open the Contacts app, add your Google account, and sync contacts.'
                      : 'No contacts on this device yet.'
                    : 'No contacts found.'}
          </Text>
          {!permissionDenied && (
            <Button title="Reload contacts" size="sm" variant="secondary" className="mt-4" onPress={() => reload()} />
          )}
          {Platform.OS === 'android' && addressBookEmpty && (
            <Button
              title="Open Contacts app"
              size="sm"
              variant="ghost"
              className="mt-2"
              onPress={() => Linking.openURL('content://com.android.contacts/contacts/')}
            />
          )}
        </View>
      ) : (
        <View className="gap-3">
          {filtered.map((row) => {
            const status = resolveStatus(row, memberSet, pendingEmailSet, pendingPhoneSet);

            return (
              <View
                key={row.id}
                className="rounded-2xl border border-glass-border bg-charcoal-900 p-4">
                <Text variant="body">{row.name}</Text>
                <Text variant="caption" muted className="mt-1">
                  {contactSubtitle(row)}
                </Text>
                <Text variant="label" muted className="mt-2 normal-case">
                  {row.onPlatform ? 'On YouHoo Alert' : 'Not on YouHoo Alert'}
                </Text>

                {status === 'member' && (
                  <Text variant="caption" className="mt-3 text-responder-light">
                    In this group
                  </Text>
                )}

                {status === 'pending' && (
                  <Text variant="caption" className="mt-3 text-warning">
                    Request pending
                  </Text>
                )}

                {status === 'add' && (
                  <Button
                    title="Send request"
                    size="sm"
                    className="mt-3"
                    loading={busyId === row.id}
                    disabled={!row.userId && !row.inviteEmail}
                    onPress={() => handleAdd(row)}
                  />
                )}

                {status === 'invite' && (
                  <Button
                    title="Invite to app"
                    size="sm"
                    variant="secondary"
                    className="mt-3"
                    loading={busyId === row.id}
                    disabled={!row.canReach}
                    onPress={() => handleInvite(row)}
                  />
                )}
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}
