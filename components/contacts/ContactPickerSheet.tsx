import {
  ContactGroupsSheet,
  type ContactGroupAction,
} from '@/components/contacts/ContactGroupsSheet';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { APP_INVITE_MESSAGE } from '@/constants/invites';
import { lookupUsersByEmail } from '@/services/api/users';
import {
  deviceHasContacts,
  loadDeviceContacts,
  pickDeviceContact,
  requestContactsPermission,
} from '@/services/contacts';
import { ApiError } from '@/services/api/client';
import type { CircleContact, DeviceContact } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Share,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ContactPickerSheetProps {
  visible: boolean;
  preselectedGroupIds?: string[];
  onClose: () => void;
  onUpdated: () => void;
}

type ContactRow = DeviceContact & {
  primaryEmail?: string;
  onPlatform: boolean;
  userId?: string;
  canReach: boolean;
};

function toCircleContact(row: ContactRow, groupIds: string[] = []): CircleContact {
  return {
    id: row.userId ?? `invite:${row.primaryEmail ?? row.id}`,
    userId: row.userId,
    displayName: row.name,
    email: row.primaryEmail,
    phone: row.phoneNumbers[0],
    groupIds,
    onPlatform: row.onPlatform,
    status: row.onPlatform ? 'member' : 'invited',
  };
}

function contactSubtitle(row: ContactRow): string {
  if (row.primaryEmail && row.phoneNumbers[0]) {
    return `${row.primaryEmail} · ${row.phoneNumbers[0]}`;
  }
  return row.primaryEmail ?? row.phoneNumbers[0] ?? 'No email or phone on this contact';
}

export function ContactPickerSheet({
  visible,
  preselectedGroupIds = [],
  onClose,
  onUpdated,
}: ContactPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [addressBookEmpty, setAddressBookEmpty] = useState(false);
  const [manualEmail, setManualEmail] = useState('');
  const [pickingContact, setPickingContact] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CircleContact | null>(null);
  const [selectedAction, setSelectedAction] = useState<ContactGroupAction>('add-to-circle');
  const [showGroupsSheet, setShowGroupsSheet] = useState(false);

  const enrichContacts = async (contacts: DeviceContact[]): Promise<ContactRow[]> => {
    const emails = contacts.flatMap((contact) => contact.emails);
    const matches = emails.length > 0 ? await lookupUsersByEmail(emails) : [];
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
  };

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setPermissionDenied(false);
      setAddressBookEmpty(false);
      setManualEmail('');
      setSearch('');
      try {
        const granted = await requestContactsPermission();
        if (!granted) {
          if (!cancelled) setPermissionDenied(true);
          return;
        }

        const [contacts, hasAny] = await Promise.all([loadDeviceContacts(), deviceHasContacts()]);
        const enriched = await enrichContacts(contacts);

        if (!cancelled) {
          setAddressBookEmpty(!hasAny);
          setRows(enriched);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Could not load contacts.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [visible]);

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

  const openGroupPicker = (row: ContactRow, action: ContactGroupAction) => {
    setSelectedContact(toCircleContact(row));
    setSelectedAction(action);
    setShowGroupsSheet(true);
  };

  const shareInstallLink = async (row: ContactRow) => {
    const message = row.onPlatform
      ? `${row.name}, open YouHoo Alert to accept my trusted circle invitation.`
      : `${APP_INVITE_MESSAGE}\n\n${row.name}, join my trusted circles on YouHoo Alert.`;
    if (row.phoneNumbers[0]) {
      const body = encodeURIComponent(message);
      const phone = row.phoneNumbers[0].replace(/[^\d+]/g, '');
      await Linking.openURL(`sms:${phone}?body=${body}`);
      return;
    }
    await Share.share({ message });
  };

  const handleNativePick = async () => {
    setPickingContact(true);
    setError(null);
    try {
      const contact = await pickDeviceContact();
      if (!contact) return;

      const [enriched] = await enrichContacts([contact]);
      if (!enriched) return;

      if (enriched.onPlatform) {
        openGroupPicker(enriched, 'add-to-circle');
      } else if (enriched.canReach) {
        openGroupPicker(enriched, 'invite-to-app');
      } else {
        setError('That contact has no email or phone number to invite.');
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not open the contact picker.');
    } finally {
      setPickingContact(false);
    }
  };

  const handleManualInvite = async () => {
    const email = manualEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    setError(null);
    try {
      const matches = await lookupUsersByEmail([email]);
      const match = matches[0];
      const row: ContactRow = {
        id: `manual:${email}`,
        name: email,
        emails: [email],
        phoneNumbers: [],
        primaryEmail: email,
        onPlatform: Boolean(match),
        userId: match?.user_id,
        canReach: true,
      };
      openGroupPicker(row, match ? 'add-to-circle' : 'invite-to-app');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not look up that email.');
    }
  };

  const handleGroupsSaved = async () => {
    await queryClient.invalidateQueries({ queryKey: ['contacts'] });
    await queryClient.invalidateQueries({ queryKey: ['groups'] });
    await queryClient.invalidateQueries({ queryKey: ['group-invites'] });
    onUpdated();
    setShowGroupsSheet(false);
    setSelectedContact(null);
  };

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View
          className="flex-1 bg-charcoal-950"
          style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}>
          <View className="mb-4 flex-row items-center justify-between px-5">
            <Text variant="title">Add contact</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <Text variant="body" className="text-responder-light">
                Close
              </Text>
            </Pressable>
          </View>

          <Text variant="caption" muted className="mb-4 px-5">
            Pick someone from your phone. On YouHoo Alert users can be added to circles after they
            accept. Everyone else gets an install invite.
          </Text>

          <TextInput
            className="mx-5 mb-4 min-h-[48px] rounded-2xl border border-glass-border bg-charcoal-900 px-4 text-base text-white"
            placeholder="Search contacts"
            placeholderTextColor="#6d6d75"
            value={search}
            onChangeText={setSearch}
          />

          {permissionDenied && (
            <Text variant="body" muted className="mb-4 px-5">
              Contacts access is needed to pick people from your phone. Enable it in Settings to
              continue.
            </Text>
          )}

          {error && (
            <Text variant="caption" className="mb-3 px-5 text-emergency">
              {error}
            </Text>
          )}

          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator color="#6bb892" />
              <Text variant="caption" muted className="mt-3">
                Loading contacts…
              </Text>
            </View>
          ) : (
            <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
              {filtered.length === 0 ? (
                <Text variant="body" muted className="py-8 text-center">
                  {rows.length > 0
                    ? 'No contacts match your search.'
                    : addressBookEmpty
                      ? 'No contacts on this device yet. Add people in your phone’s Contacts app or invite by email below.'
                      : 'No contacts found. Try inviting by email below.'}
                </Text>
              ) : (
                filtered.map((row) => (
                  <View
                    key={row.id}
                    className="mb-3 rounded-2xl border border-glass-border bg-charcoal-900 p-4">
                    <Text variant="body">{row.name}</Text>
                    <Text variant="caption" muted className="mt-1">
                      {contactSubtitle(row)}
                    </Text>
                    <Text variant="label" muted className="mt-2 normal-case">
                      {row.onPlatform ? 'On YouHoo Alert' : 'Not on YouHoo Alert yet'}
                    </Text>

                    {row.onPlatform ? (
                      <View className="mt-3 flex-row gap-2">
                        <Button
                          title="Add"
                          size="sm"
                          className="flex-1"
                          disabled={!row.primaryEmail}
                          onPress={() => openGroupPicker(row, 'add-to-circle')}
                        />
                        <Button
                          title="Invite"
                          size="sm"
                          variant="secondary"
                          className="flex-1"
                          disabled={!row.canReach}
                          onPress={() => shareInstallLink(row)}
                        />
                      </View>
                    ) : (
                      <Button
                        title="Invite to YouHoo Alert"
                        size="sm"
                        className="mt-3"
                        variant="secondary"
                        disabled={!row.canReach}
                        onPress={() => openGroupPicker(row, 'invite-to-app')}
                      />
                    )}

                    {!row.primaryEmail && row.onPlatform && (
                      <Text variant="caption" muted className="mt-2">
                        Add an email to this contact to send a circle invitation.
                      </Text>
                    )}
                    {!row.canReach && !row.onPlatform && (
                      <Text variant="caption" muted className="mt-2">
                        Add an email or phone number to this contact before inviting.
                      </Text>
                    )}
                  </View>
                ))
              )}

              {!permissionDenied && (
                <View className="mt-2 rounded-2xl border border-glass-border bg-charcoal-900 p-4">
                  <Text variant="body" className="mb-2">
                    Other ways to add someone
                  </Text>
                  <Button
                    title="Pick from phone contacts"
                    size="sm"
                    variant="secondary"
                    loading={pickingContact}
                    onPress={handleNativePick}
                  />
                  <Text variant="caption" muted className="mb-2 mt-4">
                    Or invite by email
                  </Text>
                  <TextInput
                    className="mb-3 min-h-[48px] rounded-2xl border border-glass-border bg-charcoal-950 px-4 text-base text-white"
                    placeholder="name@example.com"
                    placeholderTextColor="#6d6d75"
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="email-address"
                    value={manualEmail}
                    onChangeText={setManualEmail}
                  />
                  <Button title="Continue with email" size="sm" onPress={handleManualInvite} />
                </View>
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      <ContactGroupsSheet
        visible={showGroupsSheet}
        contact={selectedContact}
        preselectedGroupIds={preselectedGroupIds}
        action={selectedAction}
        onClose={() => {
          setShowGroupsSheet(false);
          setSelectedContact(null);
        }}
        onSaved={handleGroupsSaved}
      />
    </>
  );
}
