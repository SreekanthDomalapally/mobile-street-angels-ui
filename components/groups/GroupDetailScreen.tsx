import { GroupContactList } from '@/components/contacts/GroupContactList';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { GroupEmergencyTypesSection } from '@/components/groups/GroupEmergencyTypesSection';
import { GroupMembersSection } from '@/components/groups/GroupMembersSection';
import { TripWatchGroupSection } from '@/components/trip/TripWatchGroupSection';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useGroup } from '@/hooks/useGroup';
import { useGroups, useRemoveGroupMember, useUpdateGroup } from '@/hooks/useGroups';
import { EmergencyTypeSummary } from '@/components/groups/EmergencyTypeSummary';
import { ApiError } from '@/services/api/client';
import type { GroupMember } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';

interface GroupDetailScreenProps {
  groupId: string;
}

export function GroupDetailScreen({ groupId }: GroupDetailScreenProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { data: groups, refetch: refetchGroups } = useGroups();
  const { data: group, isLoading, isError, refetch: refetchGroup } = useGroup(groupId);
  const updateGroupMutation = useUpdateGroup();
  const removeMemberMutation = useRemoveGroupMember();

  const [addMembersVisible, setAddMembersVisible] = useState(false);
  const [renameVisible, setRenameVisible] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [renameError, setRenameError] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  const listGroup = groups?.find((g) => g.id === groupId);
  const resolvedGroup = group ?? listGroup;
  const groupName = resolvedGroup?.name ?? 'Group';
  const selectedRole = group?.myRole ?? listGroup?.myRole;
  const canManageMembers = selectedRole === 'owner' || selectedRole === 'admin';

  useEffect(() => {
    if (!renameVisible) return;
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvent, (e) => setKeyboardHeight(e.endCoordinates.height));
    const hideSub = Keyboard.addListener(hideEvent, () => setKeyboardHeight(0));
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [renameVisible]);

  useFocusEffect(
    useCallback(() => {
      void refetchGroup();
      void refetchGroups();
      queryClient.invalidateQueries({ queryKey: ['group-invites'] });
    }, [refetchGroup, refetchGroups, queryClient])
  );

  const memberEmails = useMemo(() => {
    const members = group?.members?.length ? group.members : (listGroup?.members ?? []);
    return members.map((m) => m.email?.toLowerCase() ?? '').filter(Boolean);
  }, [group, listGroup]);

  const pendingEmails = useMemo(() => {
    const pending = group?.pendingInvites?.length
      ? group.pendingInvites
      : (listGroup?.pendingInvites ?? []);
    return pending
      .map((i) => i.inviteeEmail.toLowerCase())
      .filter((e) => !e.endsWith('@phone.pending'));
  }, [group, listGroup]);

  const pendingPhones = useMemo(() => {
    const pending = group?.pendingInvites?.length
      ? group.pendingInvites
      : (listGroup?.pendingInvites ?? []);
    return pending.map((i) => i.inviteePhone).filter((p): p is string => Boolean(p));
  }, [group, listGroup]);

  const handleGroupUpdated = () => {
    void refetchGroups();
    queryClient.invalidateQueries({ queryKey: ['groups'] });
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    queryClient.invalidateQueries({ queryKey: ['group-invites'] });
    queryClient.invalidateQueries({ queryKey: ['group', groupId] });
    void refetchGroup();
  };

  const onRename = async () => {
    const trimmed = renameValue.trim();
    if (trimmed.length < 2) {
      setRenameError('Name must be at least 2 characters');
      return;
    }
    if (trimmed.toLowerCase() === groupName.trim().toLowerCase()) {
      setRenameVisible(false);
      return;
    }
    try {
      await updateGroupMutation.mutateAsync({ groupId, params: { name: trimmed } });
      setRenameVisible(false);
      handleGroupUpdated();
    } catch (error) {
      setRenameError(
        error instanceof ApiError ? error.message : 'Could not rename group.'
      );
    }
  };

  const handleRemoveMember = (member: GroupMember) => {
    Alert.alert(
      'Remove from group?',
      `Remove ${member.displayName}? They will no longer get SOS alerts from this group.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void removeMemberMutation
              .mutateAsync({ groupId, userId: member.userId })
              .then(handleGroupUpdated)
              .catch((error) =>
                Alert.alert(
                  'Could not remove',
                  error instanceof ApiError ? error.message : 'Try again.'
                )
              );
          },
        },
      ]
    );
  };

  if (isLoading && !resolvedGroup) {
    return <LoadingState message="Loading group…" />;
  }
  if (isError && !resolvedGroup) {
    return <ErrorState onRetry={() => refetchGroup()} />;
  }

  return (
    <View className="flex-1 bg-charcoal-950">
      <View
        className="flex-row items-center gap-3 border-b border-glass-border px-5 pb-4"
        style={{ paddingTop: insets.top + 8 }}
      >
        <Pressable
          onPress={() => router.back()}
          className="h-10 w-10 items-center justify-center rounded-xl bg-charcoal-800"
        >
          <Ionicons name="chevron-back" size={22} color="#a0a0a8" />
        </Pressable>
        <Pressable
          className="min-w-0 flex-1"
          onPress={canManageMembers ? () => {
            setRenameValue(groupName);
            setRenameError(null);
            setRenameVisible(true);
          } : undefined}
        >
          <Text variant="title" numberOfLines={1}>
            {groupName}
          </Text>
          {resolvedGroup ? (
            <View className="mt-1">
              <EmergencyTypeSummary types={resolvedGroup.emergencyTypes} maxVisible={4} />
            </View>
          ) : null}
        </Pressable>
        {canManageMembers ? (
          <Pressable
            onPress={() => setAddMembersVisible(true)}
            className="h-10 w-10 items-center justify-center rounded-xl bg-responder/20"
          >
            <Ionicons name="person-add-outline" size={20} color="#6bb892" />
          </Pressable>
        ) : null}
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 32 }}
        keyboardShouldPersistTaps="handled"
      >
        {canManageMembers ? (
          <Pressable
            onPress={() => setAddMembersVisible(true)}
            className="mb-5 flex-row items-center gap-3 rounded-2xl border border-responder/40 bg-responder/10 px-4 py-4"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-responder/25">
              <Ionicons name="person-add" size={20} color="#6bb892" />
            </View>
            <View className="flex-1">
              <Text variant="body" className="text-responder-light">
                Add people
              </Text>
              <Text variant="caption" muted>
                From your phone contacts — like WhatsApp
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#6bb892" />
          </Pressable>
        ) : null}

        <GroupMembersSection
          group={group ?? listGroup}
          loading={isLoading}
          canManageMembers={canManageMembers}
          removingUserId={
            removeMemberMutation.isPending
              ? (removeMemberMutation.variables?.userId ?? null)
              : null
          }
          onRemoveMember={canManageMembers ? handleRemoveMember : undefined}
        />

        {canManageMembers ? (
          <GroupEmergencyTypesSection
            key={groupId}
            groupId={groupId}
            canEdit
            seedTypes={resolvedGroup?.emergencyTypes}
            onSaved={handleGroupUpdated}
            compact
          />
        ) : (
          <GroupEmergencyTypesSection
            groupId={groupId}
            canEdit={false}
            seedTypes={resolvedGroup?.emergencyTypes}
          />
        )}

        <TripWatchGroupSection groupId={groupId} />
      </ScrollView>

      <Modal visible={addMembersVisible} animationType="slide" presentationStyle="pageSheet">
        <View
          className="flex-1 bg-charcoal-950"
          style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}
        >
          <View className="mb-4 flex-row items-center justify-between px-5">
            <Text variant="title">Add to {groupName}</Text>
            <Pressable onPress={() => setAddMembersVisible(false)}>
              <Text variant="body" className="text-responder-light">
                Done
              </Text>
            </Pressable>
          </View>
          <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
            <GroupContactList
              groupId={groupId}
              groupName={groupName}
              memberEmails={memberEmails}
              pendingEmails={pendingEmails}
              pendingPhones={pendingPhones}
              compact
              onUpdated={handleGroupUpdated}
            />
          </ScrollView>
        </View>
      </Modal>

      <Modal visible={renameVisible} animationType="slide" transparent onRequestClose={() => setRenameVisible(false)}>
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <View className="flex-1 justify-end">
            <Pressable className="absolute inset-0 bg-black/70" onPress={() => setRenameVisible(false)} />
            <View
              className="rounded-t-3xl bg-charcoal-900 px-6 pt-6"
              style={{ paddingBottom: keyboardHeight > 0 ? keyboardHeight + 16 : insets.bottom + 24 }}
            >
              <Text variant="title" className="mb-6">
                Group name
              </Text>
              <TextInput
                className="mb-2 min-h-[52px] rounded-2xl border border-glass-border bg-charcoal-800 px-4 text-base text-white"
                value={renameValue}
                onChangeText={setRenameValue}
                autoFocus
                onSubmitEditing={() => void onRename()}
              />
              {renameError ? (
                <Text variant="caption" className="text-emergency">
                  {renameError}
                </Text>
              ) : null}
              <Button title="Save" className="mt-4" loading={updateGroupMutation.isPending} onPress={() => void onRename()} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
