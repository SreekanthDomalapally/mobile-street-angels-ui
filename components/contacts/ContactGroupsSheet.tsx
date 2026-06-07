import { GroupMultiSelect } from '@/components/contacts/GroupMultiSelect';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { APP_INVITE_MESSAGE } from '@/constants/invites';
import { useManagedGroups } from '@/hooks/useManagedGroups';
import { assignInviteToGroups, setContactGroups } from '@/services/api/contacts';
import { ApiError } from '@/services/api/client';
import { addGroupMember, inviteToGroup, removeGroupMember } from '@/services/api/groups';
import type { CircleContact, Group } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

async function applyMembershipFallback(
  userId: string,
  currentGroupIds: string[],
  selectedIds: string[],
  managedGroups: Group[]
) {
  for (const group of managedGroups) {
    const shouldMember = selectedIds.includes(group.id);
    const isMember = currentGroupIds.includes(group.id);
    if (shouldMember && !isMember) {
      await addGroupMember(group.id, userId);
    } else if (!shouldMember && isMember) {
      await removeGroupMember(group.id, userId);
    }
  }
}

function buildInitialSelection(
  contact: CircleContact,
  preselectedGroupIds: string[],
  managedGroups: Group[]
) {
  const initial = new Set([...contact.groupIds, ...preselectedGroupIds]);
  return managedGroups.filter((group) => initial.has(group.id)).map((group) => group.id);
}

interface ContactGroupsSheetContentProps {
  contact: CircleContact;
  preselectedGroupIds: string[];
  onClose: () => void;
  onSaved: () => void;
}

function ContactGroupsSheetContent({
  contact,
  preselectedGroupIds,
  onClose,
  onSaved,
}: ContactGroupsSheetContentProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const managedGroups = useManagedGroups();
  const [selectedIds, setSelectedIds] = useState(() =>
    buildInitialSelection(contact, preselectedGroupIds, managedGroups)
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      setError('Select at least one circle.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (contact.onPlatform && contact.userId) {
        try {
          await setContactGroups(contact.userId, selectedIds);
        } catch (err) {
          if (err instanceof ApiError && err.status === 404) {
            await applyMembershipFallback(contact.userId, contact.groupIds, selectedIds, managedGroups);
          } else {
            throw err;
          }
        }
      } else if (contact.email) {
        try {
          await assignInviteToGroups(contact.email, selectedIds);
        } catch (err) {
          if (err instanceof ApiError && err.status === 404) {
            await Promise.all(
              selectedIds
                .filter((groupId) => !contact.groupIds.includes(groupId))
                .map((groupId) => inviteToGroup(groupId, contact.email!))
            );
          } else {
            throw err;
          }
        }
        const message = `${APP_INVITE_MESSAGE}\n\nJoin my trusted circles on YouHoo Alert.`;
        if (contact.phone) {
          const body = encodeURIComponent(message);
          const phone = contact.phone.replace(/[^\d+]/g, '');
          await Linking.openURL(`sms:${phone}?body=${body}`);
        } else {
          await Share.share({ message });
        }
      } else {
        throw new Error('Contact has no email to invite.');
      }

      await queryClient.invalidateQueries({ queryKey: ['contacts'] });
      await queryClient.invalidateQueries({ queryKey: ['groups'] });
      onSaved();
      onClose();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update circles.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <View
      className="flex-1 bg-charcoal-950"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}>
      <View className="mb-4 flex-row items-center justify-between px-5">
        <Text variant="title">Assign circles</Text>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
          <Text variant="body" className="text-responder-light">
            Close
          </Text>
        </Pressable>
      </View>

      <View className="mb-4 px-5">
        <Text variant="body">{contact.displayName}</Text>
        <Text variant="caption" muted className="mt-1">
          {contact.email ?? contact.phone ?? 'No contact info'}
        </Text>
        <Text variant="label" muted className="mt-2 normal-case">
          {contact.onPlatform ? 'On YouHoo Alert' : 'Invite pending'}
        </Text>
      </View>

      <Text variant="caption" muted className="mb-3 px-5">
        Choose every circle this person should belong to. You can only manage circles where you are
        an owner or admin.
      </Text>

      {error && (
        <Text variant="caption" className="mb-3 px-5 text-emergency">
          {error}
        </Text>
      )}

      <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
        <GroupMultiSelect
          groups={managedGroups}
          selectedIds={selectedIds}
          onChange={setSelectedIds}
          disabled={saving}
        />
      </ScrollView>

      <View className="px-5 pt-4">
        <Button title="Save circles" loading={saving} onPress={handleSave} />
      </View>
    </View>
  );
}

interface ContactGroupsSheetProps {
  visible: boolean;
  contact: CircleContact | null;
  preselectedGroupIds?: string[];
  onClose: () => void;
  onSaved: () => void;
}

export function ContactGroupsSheet({
  visible,
  contact,
  preselectedGroupIds = [],
  onClose,
  onSaved,
}: ContactGroupsSheetProps) {
  const sheetKey = useMemo(() => {
    if (!contact) return 'closed';
    return `${contact.id}:${preselectedGroupIds.join(',')}`;
  }, [contact, preselectedGroupIds]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      {visible && contact ? (
        <ContactGroupsSheetContent
          key={sheetKey}
          contact={contact}
          preselectedGroupIds={preselectedGroupIds}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </Modal>
  );
}
