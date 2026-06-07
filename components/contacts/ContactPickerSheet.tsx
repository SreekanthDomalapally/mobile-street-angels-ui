import { ContactGroupsSheet } from '@/components/contacts/ContactGroupsSheet';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { lookupUsersByEmail } from '@/services/api/users';
import { loadDeviceContacts, requestContactsPermission } from '@/services/contacts';
import { ApiError } from '@/services/api/client';
import type { CircleContact, DeviceContact } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
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
  const [selectedContact, setSelectedContact] = useState<CircleContact | null>(null);
  const [showGroupsSheet, setShowGroupsSheet] = useState(false);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setPermissionDenied(false);
      setSearch('');
      try {
        const granted = await requestContactsPermission();
        if (!granted) {
          if (!cancelled) setPermissionDenied(true);
          return;
        }

        const contacts = await loadDeviceContacts();
        const emails = contacts.flatMap((contact) => contact.emails);
        const matches = emails.length > 0 ? await lookupUsersByEmail(emails) : [];
        const matchByEmail = new Map(matches.map((match) => [match.email.toLowerCase(), match]));

        const enriched: ContactRow[] = contacts.map((contact) => {
          const matchedEmail = contact.emails.find((email) => matchByEmail.has(email));
          const match = matchedEmail ? matchByEmail.get(matchedEmail) : undefined;
          return {
            ...contact,
            primaryEmail: matchedEmail ?? contact.emails[0],
            onPlatform: Boolean(match),
            userId: match?.user_id,
          };
        });

        if (!cancelled) setRows(enriched);
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

  const openGroupPicker = (row: ContactRow) => {
    setSelectedContact(toCircleContact(row));
    setShowGroupsSheet(true);
  };

  const handleGroupsSaved = async () => {
    await queryClient.invalidateQueries({ queryKey: ['contacts'] });
    await queryClient.invalidateQueries({ queryKey: ['groups'] });
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
            Pick someone from your phone, then choose which trusted circles they belong to.
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
                  No contacts with email or phone found.
                </Text>
              ) : (
                filtered.map((row) => (
                  <View
                    key={row.id}
                    className="mb-3 rounded-2xl border border-glass-border bg-charcoal-900 p-4">
                    <Text variant="body">{row.name}</Text>
                    <Text variant="caption" muted className="mt-1">
                      {row.primaryEmail ?? row.phoneNumbers[0] ?? 'No contact info'}
                    </Text>
                    <Text variant="label" muted className="mt-2 normal-case">
                      {row.onPlatform ? 'On YouHoo Alert' : 'Not on YouHoo Alert yet'}
                    </Text>
                    <Button
                      title={row.onPlatform ? 'Choose circles' : 'Invite to circles'}
                      size="sm"
                      className="mt-3"
                      variant={row.onPlatform ? 'primary' : 'secondary'}
                      onPress={() => openGroupPicker(row)}
                    />
                  </View>
                ))
              )}
            </ScrollView>
          )}
        </View>
      </Modal>

      <ContactGroupsSheet
        visible={showGroupsSheet}
        contact={selectedContact}
        preselectedGroupIds={preselectedGroupIds}
        onClose={() => {
          setShowGroupsSheet(false);
          setSelectedContact(null);
        }}
        onSaved={handleGroupsSaved}
      />
    </>
  );
}
