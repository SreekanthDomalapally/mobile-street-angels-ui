import { GroupContactList } from '@/components/contacts/GroupContactList';
import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { GroupCard } from '@/components/groups/GroupCard';
import { GroupInvitesSection } from '@/components/groups/GroupInvitesSection';
import { GroupMembersSection } from '@/components/groups/GroupMembersSection';
import { TripWatchGroupSection } from '@/components/trip/TripWatchGroupSection';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useGroup } from '@/hooks/useGroup';
import { useCreateGroup, useGroups } from '@/hooks/useGroups';
import { hasOwnedGroupNamed } from '@/lib/groupLabels';
import { temporaryGroupExpiryIso } from '@/lib/utils';
import { ApiError } from '@/services/api/client';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
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
import { z } from 'zod';

const groupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

type GroupForm = z.infer<typeof groupSchema>;

export default function GroupsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { selected: selectedParam } = useLocalSearchParams<{ selected?: string }>();
  const { data: groups, isLoading, isError, refetch } = useGroups();
  const createGroupMutation = useCreateGroup();
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const { data: selectedGroup, isLoading: isGroupLoading, refetch: refetchGroup } = useGroup(
    selectedGroupId ?? undefined
  );
  const [modalVisible, setModalVisible] = useState(false);
  const [isTemporary, setIsTemporary] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof selectedParam === 'string' && selectedParam) {
      setSelectedGroupId(selectedParam);
    }
  }, [selectedParam]);

  useEffect(() => {
    if (!selectedGroupId && groups && groups.length > 0) {
      setSelectedGroupId(groups[0].id);
    }
  }, [groups, selectedGroupId]);

  useEffect(() => {
    if (!modalVisible) {
      return;
    }

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
  }, [modalVisible]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
      queryClient.invalidateQueries({ queryKey: ['group-invites'] });
      if (selectedGroupId) {
        void refetchGroup();
      }
    }, [refetch, refetchGroup, selectedGroupId, queryClient])
  );

  const memberEmails = useMemo(() => {
    const listGroup = groups?.find((group) => group.id === selectedGroupId);
    const members =
      selectedGroup?.members?.length ? selectedGroup.members : (listGroup?.members ?? []);
    return members.map((member) => member.email?.toLowerCase() ?? '').filter(Boolean);
  }, [selectedGroup, groups, selectedGroupId]);

  const pendingEmails = useMemo(() => {
    const listGroup = groups?.find((group) => group.id === selectedGroupId);
    const pending =
      selectedGroup?.pendingInvites?.length
        ? selectedGroup.pendingInvites
        : (listGroup?.pendingInvites ?? []);
    return pending
      .map((invite) => invite.inviteeEmail.toLowerCase())
      .filter((email) => !email.endsWith('@phone.pending'));
  }, [selectedGroup, groups, selectedGroupId]);

  const pendingPhones = useMemo(() => {
    const listGroup = groups?.find((group) => group.id === selectedGroupId);
    const pending =
      selectedGroup?.pendingInvites?.length
        ? selectedGroup.pendingInvites
        : (listGroup?.pendingInvites ?? []);
    return pending
      .map((invite) => invite.inviteePhone)
      .filter((phone): phone is string => Boolean(phone));
  }, [selectedGroup, groups, selectedGroupId]);

  const closeModal = () => {
    Keyboard.dismiss();
    setKeyboardHeight(0);
    setModalVisible(false);
    setFormError(null);
  };

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: '' },
  });

  const handleGroupUpdated = () => {
    void refetch();
    queryClient.invalidateQueries({ queryKey: ['groups'] });
    queryClient.invalidateQueries({ queryKey: ['contacts'] });
    queryClient.invalidateQueries({ queryKey: ['group-invites'] });
    if (selectedGroupId) {
      void refetchGroup();
      queryClient.invalidateQueries({ queryKey: ['group', selectedGroupId] });
    }
  };

  const onCreate = async (data: GroupForm) => {
    setFormError(null);
    if (hasOwnedGroupNamed(groups, data.name)) {
      setFormError(`You already have a circle named "${data.name.trim()}". Open it to add people.`);
      return;
    }
    try {
      const group = await createGroupMutation.mutateAsync({
        name: data.name,
        isTemporary,
        expiresAt: isTemporary ? temporaryGroupExpiryIso() : undefined,
      });
      reset();
      setIsTemporary(false);
      setModalVisible(false);
      setSelectedGroupId(group.id);
      handleGroupUpdated();
    } catch (error) {
      setFormError(
        error instanceof ApiError
          ? error.message
          : 'Could not create group. Please try again.'
      );
    }
  };

  return (
    <View className="flex-1 bg-charcoal-950">
      <View
        className="flex-row items-center justify-between px-5"
        style={{ paddingTop: insets.top + 16 }}>
        <Text variant="title">Groups</Text>
        <Button
          title="+ New"
          size="sm"
          variant="secondary"
          onPress={() => setModalVisible(true)}
        />
      </View>

      {isLoading && <LoadingState message="Loading groups…" />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && (
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 100,
            paddingTop: 16,
          }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <GroupInvitesSection />

          {groups?.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="No groups yet"
              description="Create a group before sending SOS alerts."
              action={
                <Button title="Create group" onPress={() => setModalVisible(true)} />
              }
            />
          ) : (
            <>
              <Text variant="label" className="mb-1">
                Your circles
              </Text>
              <Text variant="caption" muted className="mb-3">
                Each circle is private. People you invite only join this circle — they may have
                their own with the same name.
              </Text>
              {groups?.map((group) => {
                const enriched =
                  selectedGroupId === group.id && selectedGroup
                    ? {
                        ...group,
                        memberCount: Math.max(
                          group.memberCount,
                          selectedGroup.memberCount,
                          selectedGroup.members.length
                        ),
                        members: selectedGroup.members,
                        pendingInvites: selectedGroup.pendingInvites,
                      }
                    : group;

                return (
                  <GroupCard
                    key={group.id}
                    group={enriched}
                    selected={selectedGroupId === group.id}
                    onPress={() => setSelectedGroupId(group.id)}
                  />
                );
              })}

              {selectedGroupId && (
                <View className="mt-4 border-t border-glass-border pt-6">
                  <TripWatchGroupSection groupId={selectedGroupId} />

                  <GroupMembersSection
                    group={selectedGroup ?? groups?.find((group) => group.id === selectedGroupId)}
                    loading={isGroupLoading}
                  />

                  <GroupContactList
                    groupId={selectedGroupId}
                    groupName={selectedGroup?.name ?? groups?.find((g) => g.id === selectedGroupId)?.name}
                    memberEmails={memberEmails}
                    pendingEmails={pendingEmails}
                    pendingPhones={pendingPhones}
                    onUpdated={handleGroupUpdated}
                  />
                </View>
              )}
            </>
          )}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <Pressable className="flex-1 justify-end bg-black/70" onPress={closeModal}>
            <Pressable
              className="rounded-t-3xl bg-charcoal-900 px-6 pt-6"
              style={{
                paddingBottom:
                  keyboardHeight > 0 ? keyboardHeight + 16 : insets.bottom + 24,
              }}
              onPress={(e) => e.stopPropagation()}>
              <Text variant="title" className="mb-6">
                New group
              </Text>
              <Controller
                control={control}
                name="name"
                render={({ field: { onChange, onBlur, value } }) => (
                  <TextInput
                    className="mb-2 min-h-[52px] rounded-2xl border border-glass-border bg-charcoal-800 px-4 text-base text-white"
                    placeholder="Group name"
                    placeholderTextColor="#6d6d75"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value}
                    autoFocus
                    accessibilityLabel="Group name"
                  />
                )}
              />
              {errors.name && (
                <Text variant="caption" className="mb-4 text-emergency">
                  {errors.name.message}
                </Text>
              )}
              {formError && (
                <Text variant="caption" className="mb-4 text-emergency">
                  {formError}
                </Text>
              )}
              <Pressable
                onPress={() => setIsTemporary(!isTemporary)}
                className="mb-6 flex-row items-center gap-3 py-2"
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isTemporary }}>
                <View
                  className={`h-6 w-6 rounded-md border ${isTemporary ? 'border-responder bg-responder' : 'border-charcoal-500'}`}
                />
                <Text variant="body">Temporary group (expires in 1 hour)</Text>
              </Pressable>
              <Button
                title="Create"
                loading={createGroupMutation.isPending}
                onPress={handleSubmit(onCreate)}
              />
            </Pressable>
          </Pressable>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}
