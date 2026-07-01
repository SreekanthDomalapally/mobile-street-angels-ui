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
    const showSub = Keyboard.addListener(showEvent, (event) => {
      setKeyboardHeight(event.endCoordinates.height);
    });
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
    return members.map((member) => member.email?.toLowerCase() ?? '').filter(Boolean);
  }, [group, listGroup]);

  const pendingEmails = useMemo(() => {
    const pending = group?.pendingInvites?.length
      ? group.pendingInvites
      : (listGroup?.pendingInvites ?? []);
    return pending
      .map((invite) => invite.inviteeEmail.toLowerCase())
      .filter((email) => !email.endsWith('@phone.pending'));
  }, [group, listGroup]);

  const pendingPhones = useMemo(() => {
    const pending = group?.pendingInvites?.length
      ? group.pendingInvites
      : (listGroup?.pendingInvites ?? []);
    return pending
      .map((invite) => invite.inviteePhone)
      .filter((phone): phone is string => Boolean(phone));
  }, [group, listGroup]);

  const handleGroupUpdated = () => {
    void refetchGroups();
    queryClient.invalidateQueries({ queryKey: ['groups'] });
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    queryClient.invalidateQueries({ queryKey: ['group-invites'] });
    queryClient.invalidateQueries({ queryKey: ['group', groupId] });
    void refetchGroup();
  };

  const openRename = () => {
    setRenameValue(groupName);
    setRenameError(null);
    setRenameVisible(true);
  };

  const closeRename = () => {
    Keyboard.dismiss();
    setKeyboardHeight(0);
    setRenameVisible(false);
    setRenameError(null);
  };

  const onRename = async () => {
    const trimmed = renameValue.trim();
    if (trimmed.length < 2) {
      setRenameError('Name must be at least 2 characters');
      return;
    }
    if (trimmed.toLowerCase() === groupName.trim().toLowerCase()) {
      closeRename();
      return;
    }
    const clash = (groups ?? []).some(
      (item) =>
        item.id !== groupId &&
        item.myRole === 'owner' &&
        item.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (clash) {
      setRenameError(`You already have a group named "${trimmed}".`);
      return;
    }
    try {
      await updateGroupMutation.mutateAsync({
        groupId,
        params: { name: trimmed },
      });
      closeRename();
      handleGroupUpdated();
    } catch (error) {
      setRenameError(
        error instanceof ApiError ? error.message : 'Could not rename group. Please try again.'
      );
    }
  };

  const handleRemoveMember = (member: GroupMember) => {
    Alert.alert(
      'Remove from group?',
      `Remove ${member.displayName} from this group? They will no longer receive SOS alerts from it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await removeMemberMutation.mutateAsync({
                  groupId,
                  userId: member.userId,
                });
                handleGroupUpdated();
              } catch (error) {
                Alert.alert(
                  'Could not remove member',
                  error instanceof ApiError ? error.message : 'Please try again in a moment.'
                );
              }
            })();
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
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-xl bg-charcoal-800"
        >
          <Ionicons name="chevron-back" size={22} color="#a0a0a8" />
        </Pressable>
        <View className="min-w-0 flex-1">
          <View className="flex-row items-center gap-2">
            <Text variant="title" numberOfLines={1} className="flex-1">
              {groupName}
            </Text>
            {canManageMembers ? (
              <Pressable
                onPress={openRename}
                accessibilityRole="button"
                accessibilityLabel="Rename group"
                hitSlop={8}
                className="h-9 w-9 items-center justify-center rounded-xl bg-charcoal-800"
              >
                <Ionicons name="create-outline" size={18} color="#a0a0a8" />
              </Pressable>
            ) : null}
          </View>
          {resolvedGroup ? (
            <View className="mt-2">
              <EmergencyTypeSummary types={resolvedGroup.emergencyTypes} maxVisible={6} />
            </View>
          ) : null}
        </View>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingTop: 20,
          paddingBottom: insets.bottom + 32,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <GroupEmergencyTypesSection
          key={groupId}
          groupId={groupId}
          canEdit={canManageMembers}
          seedTypes={resolvedGroup?.emergencyTypes}
          onSaved={handleGroupUpdated}
        />

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

        <GroupContactList
          groupId={groupId}
          groupName={groupName}
          memberEmails={memberEmails}
          pendingEmails={pendingEmails}
          pendingPhones={pendingPhones}
          onUpdated={handleGroupUpdated}
        />

        <TripWatchGroupSection groupId={groupId} />
      </ScrollView>

      <Modal visible={renameVisible} animationType="slide" transparent onRequestClose={closeRename}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <View className="flex-1 justify-end">
            <Pressable
              className="absolute inset-0 bg-black/70"
              onPress={updateGroupMutation.isPending ? undefined : closeRename}
              accessibilityRole="button"
              accessibilityLabel="Close rename dialog"
            />
            <View
              className="rounded-t-3xl bg-charcoal-900 px-6 pt-6"
              style={{
                paddingBottom: keyboardHeight > 0 ? keyboardHeight + 16 : insets.bottom + 24,
              }}
            >
              <Text variant="title" className="mb-6">
                Rename group
              </Text>
              <TextInput
                className="mb-2 min-h-[52px] rounded-2xl border border-glass-border bg-charcoal-800 px-4 text-base text-white"
                placeholder="Group name"
                placeholderTextColor="#6d6d75"
                value={renameValue}
                onChangeText={(text) => {
                  setRenameValue(text);
                  if (renameError) setRenameError(null);
                }}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={() => void onRename()}
                editable={!updateGroupMutation.isPending}
                accessibilityLabel="Group name"
              />
              {renameError ? (
                <Text variant="caption" className="mb-4 text-emergency">
                  {renameError}
                </Text>
              ) : null}
              <Button
                title="Save"
                className="mt-4"
                loading={updateGroupMutation.isPending}
                disabled={updateGroupMutation.isPending}
                onPress={() => void onRename()}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
