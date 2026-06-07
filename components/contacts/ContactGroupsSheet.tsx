import { GroupMultiSelect } from '@/components/contacts/GroupMultiSelect';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { APP_INVITE_MESSAGE } from '@/constants/invites';
import { useManagedGroups } from '@/hooks/useManagedGroups';
import { assignInviteToGroups } from '@/services/api/contacts';
import { ApiError } from '@/services/api/client';
import { inviteToGroup, removeGroupMember } from '@/services/api/groups';
import type { CircleContact, Group } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export type ContactGroupAction = 'add-to-circle' | 'invite-to-app';

async function removeFromGroups(
  userId: string,
  currentGroupIds: string[],
  selectedIds: string[],
  managedGroups: Group[]
) {
  for (const group of managedGroups) {
    const shouldMember = selectedIds.includes(group.id);
    const isMember = currentGroupIds.includes(group.id);
    if (!shouldMember && isMember) {
      await removeGroupMember(group.id, userId);
    }
  }
}

async function sendGroupInvites(email: string, groupIds: string[], existingGroupIds: string[]) {
  const toInvite = groupIds.filter((groupId) => !existingGroupIds.includes(groupId));
  if (toInvite.length === 0) return;

  try {
    await assignInviteToGroups(email, toInvite);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      await Promise.all(toInvite.map((groupId) => inviteToGroup(groupId, email)));
      return;
    }
    throw err;
  }
}

async function shareInstallInvite(contact: CircleContact) {
  const message = `${APP_INVITE_MESSAGE}\n\n${contact.displayName}, join my trusted circles on YouHoo Alert.`;
  if (contact.phone) {
    const body = encodeURIComponent(message);
    const phone = contact.phone.replace(/[^\d+]/g, '');
    await Linking.openURL(`sms:${phone}?body=${body}`);
    return;
  }
  await Share.share({ message });
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
  action: ContactGroupAction;
  onClose: () => void;
  onSaved: () => void;
}

function ContactGroupsSheetContent({
  contact,
  preselectedGroupIds,
  action,
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
  const [success, setSuccess] = useState<string | null>(null);

  const inviteEmail = contact.email?.trim().toLowerCase();
  const canInviteByEmail = Boolean(inviteEmail);
  const canShareInstall = Boolean(inviteEmail || contact.phone);

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      setError('Select at least one circle.');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const toInvite = selectedIds.filter((groupId) => !contact.groupIds.includes(groupId));

      if (contact.onPlatform && contact.userId) {
        await removeFromGroups(contact.userId, contact.groupIds, selectedIds, managedGroups);
      }

      if (toInvite.length > 0) {
        if (!canInviteByEmail) {
          throw new Error('Add an email to this contact before inviting them to a circle.');
        }
        await sendGroupInvites(inviteEmail!, toInvite, contact.groupIds);
      }

      if (action === 'invite-to-app') {
        if (!canShareInstall) {
          throw new Error('Add an email or phone number to send an install invite.');
        }
        await shareInstallInvite(contact);
        setSuccess('Install invite sent. They can join your circles after signing up.');
      } else if (toInvite.length > 0) {
        setSuccess('Invitation sent. They will appear after accepting.');
      }

      await queryClient.invalidateQueries({ queryKey: ['contacts'] });
      await queryClient.invalidateQueries({ queryKey: ['groups'] });
      await queryClient.invalidateQueries({ queryKey: ['group-invites'] });
      onSaved();

      if (action === 'add-to-circle' && toInvite.length > 0) {
        onClose();
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update circles.');
    } finally {
      setSaving(false);
    }
  };

  const saveLabel =
    action === 'invite-to-app'
      ? 'Invite to YouHoo Alert'
      : contact.onPlatform
        ? 'Send circle invite'
        : 'Send invite';

  return (
    <View
      className="flex-1 bg-charcoal-950"
      style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}>
      <View className="mb-4 flex-row items-center justify-between px-5">
        <Text variant="title">{action === 'invite-to-app' ? 'Invite to install' : 'Add to circle'}</Text>
        <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
          <Text variant="body" className="text-responder-light">
            Close
          </Text>
        </Pressable>
      </View>

      <View className="mb-4 px-5">
        <Text variant="body">{contact.displayName}</Text>
        <Text variant="caption" muted className="mt-1">
          {contact.email ?? contact.phone ?? 'No email or phone on this contact'}
        </Text>
        <Text variant="label" muted className="mt-2 normal-case">
          {contact.onPlatform
            ? 'On YouHoo Alert — they must accept before joining'
            : 'Not on YouHoo Alert yet — invite them to install the app'}
        </Text>
      </View>

      <Text variant="caption" muted className="mb-3 px-5">
        {action === 'invite-to-app'
          ? 'Choose circles to invite them to. We will send an install link and hold the invite until they sign up.'
          : 'Choose circles to invite them to. They must accept before becoming a member.'}
      </Text>

      {error && (
        <Text variant="caption" className="mb-3 px-5 text-emergency">
          {error}
        </Text>
      )}

      {success && (
        <Text variant="caption" className="mb-3 px-5 text-responder-light">
          {success}
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
        <Button title={saveLabel} loading={saving} onPress={handleSave} />
      </View>
    </View>
  );
}

interface ContactGroupsSheetProps {
  visible: boolean;
  contact: CircleContact | null;
  preselectedGroupIds?: string[];
  action?: ContactGroupAction;
  onClose: () => void;
  onSaved: () => void;
}

export function ContactGroupsSheet({
  visible,
  contact,
  preselectedGroupIds = [],
  action = 'add-to-circle',
  onClose,
  onSaved,
}: ContactGroupsSheetProps) {
  const sheetKey = useMemo(() => {
    if (!contact) return 'closed';
    return `${contact.id}:${action}:${preselectedGroupIds.join(',')}`;
  }, [contact, action, preselectedGroupIds]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      {visible && contact ? (
        <ContactGroupsSheetContent
          key={sheetKey}
          contact={contact}
          preselectedGroupIds={preselectedGroupIds}
          action={action}
          onClose={onClose}
          onSaved={onSaved}
        />
      ) : null}
    </Modal>
  );
}
