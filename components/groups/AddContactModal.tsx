import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { APP_INVITE_MESSAGE } from '@/constants/invites';
import { lookupUsersByEmail } from '@/services/api/users';
import { addGroupMember, inviteToGroup } from '@/services/api/groups';
import { loadDeviceContacts, requestContactsPermission } from '@/services/contacts';
import { ApiError } from '@/services/api/client';
import type { DeviceContact } from '@/types';
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

interface AddContactModalProps {
  visible: boolean;
  groupId: string;
  groupName: string;
  existingMemberIds: string[];
  existingEmails: string[];
  onClose: () => void;
  onUpdated: () => void;
}

type ContactRow = DeviceContact & {
  primaryEmail?: string;
  onPlatform: boolean;
  userId?: string;
  alreadyInGroup: boolean;
};

export function AddContactModal({
  visible,
  groupId,
  groupName,
  existingMemberIds,
  existingEmails,
  onClose,
  onUpdated,
}: AddContactModalProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [rows, setRows] = useState<ContactRow[]>([]);
  const [permissionDenied, setPermissionDenied] = useState(false);

  useEffect(() => {
    if (!visible) return;

    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      setPermissionDenied(false);
      try {
        const granted = await requestContactsPermission();
        if (!granted) {
          if (!cancelled) setPermissionDenied(true);
          return;
        }

        const contacts = await loadDeviceContacts();
        const emails = contacts.flatMap((c) => c.emails);
        const matches = emails.length > 0 ? await lookupUsersByEmail(emails) : [];
        const matchByEmail = new Map(matches.map((m) => [m.email.toLowerCase(), m]));
        const memberEmailSet = new Set(existingEmails.map((e) => e.toLowerCase()));

        const enriched: ContactRow[] = contacts.map((contact) => {
          const primaryEmail = contact.emails[0];
          const match = primaryEmail ? matchByEmail.get(primaryEmail) : undefined;
          return {
            ...contact,
            primaryEmail,
            onPlatform: Boolean(match),
            userId: match?.user_id,
            alreadyInGroup:
              Boolean(match && existingMemberIds.includes(match.user_id)) ||
              Boolean(primaryEmail && memberEmailSet.has(primaryEmail)),
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
  }, [visible, existingEmails, existingMemberIds]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(
      (row) =>
        row.name.toLowerCase().includes(query) ||
        row.emails.some((e) => e.includes(query)) ||
        row.phoneNumbers.some((p) => p.includes(query))
    );
  }, [rows, search]);

  const handleAdd = async (row: ContactRow) => {
    if (!row.userId) return;
    setActionId(row.id);
    setError(null);
    try {
      await addGroupMember(groupId, row.userId);
      await queryClient.invalidateQueries({ queryKey: ['groups'] });
      onUpdated();
      setRows((prev) =>
        prev.map((item) => (item.id === row.id ? { ...item, alreadyInGroup: true } : item))
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not add member.');
    } finally {
      setActionId(null);
    }
  };

  const handleInvite = async (row: ContactRow) => {
    setActionId(row.id);
    setError(null);
    try {
      if (row.primaryEmail) {
        await inviteToGroup(groupId, row.primaryEmail);
      }
      const message = `${APP_INVITE_MESSAGE}\n\n${groupName} on YouHoo Alert is waiting for you.`;
      if (row.phoneNumbers[0]) {
        const body = encodeURIComponent(message);
        const phone = row.phoneNumbers[0].replace(/[^\d+]/g, '');
        await Linking.openURL(`sms:${phone}?body=${body}`);
      } else {
        await Share.share({ message });
      }
      await queryClient.invalidateQueries({ queryKey: ['groups'] });
      onUpdated();
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      }
    } finally {
      setActionId(null);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View
        className="flex-1 bg-charcoal-950"
        style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}>
        <View className="mb-4 flex-row items-center justify-between px-5">
          <Text variant="title">Add trusted contact</Text>
          <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
            <Text variant="body" className="text-responder-light">
              Close
            </Text>
          </Pressable>
        </View>

        <Text variant="caption" muted className="mb-4 px-5">
          People on YouHoo Alert can be added to your circle. Others will get an invite to join and
          receive your SOS alerts.
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
            Contacts access is needed to pick people from your phone. You can still invite by email
            from your group settings later.
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

                  {row.alreadyInGroup ? (
                    <Text variant="caption" className="mt-3 text-responder-light">
                      Already in this circle
                    </Text>
                  ) : row.onPlatform && row.userId ? (
                    <Button
                      title="Add to circle"
                      size="sm"
                      className="mt-3"
                      loading={actionId === row.id}
                      onPress={() => handleAdd(row)}
                    />
                  ) : (
                    <Button
                      title="Invite to YouHoo Alert"
                      variant="secondary"
                      size="sm"
                      className="mt-3"
                      loading={actionId === row.id}
                      onPress={() => handleInvite(row)}
                    />
                  )}
                </View>
              ))
            )}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}
