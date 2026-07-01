import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { GroupCard } from '@/components/groups/GroupCard';
import {
  CreateGroupEmergencyTypesPicker,
  type AssignmentMode,
} from '@/components/groups/GroupEmergencyTypesSection';
import { GroupInvitesSection } from '@/components/groups/GroupInvitesSection';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useCreateGroup, useGroups } from '@/hooks/useGroups';
import { hasOwnedGroupNamed } from '@/lib/groupLabels';
import { temporaryGroupExpiryIso } from '@/lib/utils';
import { ApiError } from '@/services/api/client';
import { setGroupEmergencyTypes } from '@/services/api/groups';
import { zodResolver } from '@hookform/resolvers/zod';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import type { EmergencyType } from '@/types';
import {
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  FlatList,
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
  const [modalVisible, setModalVisible] = useState(false);
  const [isTemporary, setIsTemporary] = useState(false);
  const [createEmergencyMode, setCreateEmergencyMode] = useState<AssignmentMode>('all');
  const [createEmergencyTypes, setCreateEmergencyTypes] = useState<Set<EmergencyType>>(new Set());
  const [formError, setFormError] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    if (typeof selectedParam === 'string' && selectedParam) {
      router.replace(`/group/${selectedParam}`);
    }
  }, [selectedParam]);

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
    }, [refetch, queryClient])
  );

  const closeModal = () => {
    Keyboard.dismiss();
    setKeyboardHeight(0);
    setModalVisible(false);
    setFormError(null);
    setCreateEmergencyMode('all');
    setCreateEmergencyTypes(new Set());
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
  };

  const onCreate = async (data: GroupForm) => {
    setFormError(null);
    if (hasOwnedGroupNamed(groups, data.name)) {
      setFormError(`You already have a circle named "${data.name.trim()}". Open it to add people.`);
      return;
    }
    if (createEmergencyMode === 'specific' && createEmergencyTypes.size === 0) {
      setFormError('Select at least one emergency type, or choose All types.');
      return;
    }
    try {
      const group = await createGroupMutation.mutateAsync({
        name: data.name,
        isTemporary,
        expiresAt: isTemporary ? temporaryGroupExpiryIso() : undefined,
      });
      if (createEmergencyMode === 'specific' && createEmergencyTypes.size > 0) {
        await setGroupEmergencyTypes(group.id, Array.from(createEmergencyTypes));
      }
      reset();
      setIsTemporary(false);
      setCreateEmergencyMode('all');
      setCreateEmergencyTypes(new Set());
      setModalVisible(false);
      handleGroupUpdated();
      router.push(`/group/${group.id}`);
    } catch (error) {
      setFormError(
        error instanceof ApiError ? error.message : 'Could not create group. Please try again.'
      );
    }
  };

  return (
    <View className="flex-1 bg-charcoal-950">
      <View
        className="flex-row items-center justify-between px-5"
        style={{ paddingTop: insets.top + 16 }}
      >
        <Text variant="title">Groups</Text>
        <Button title="+ New" size="sm" variant="secondary" onPress={() => setModalVisible(true)} />
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
          showsVerticalScrollIndicator={false}
        >
          <GroupInvitesSection />

          {groups?.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="No groups yet"
              description="Create a group before sending SOS alerts."
              action={<Button title="Create group" onPress={() => setModalVisible(true)} />}
            />
          ) : (
            <>
              <Text variant="label" className="mb-1">
                Your groups
              </Text>
              <Text variant="caption" muted className="mb-3">
                Tap a group to manage members, emergency types, and invites.
              </Text>
              <FlatList
                data={groups ?? []}
                keyExtractor={(group) => group.id}
                scrollEnabled={false}
                renderItem={({ item: group }) => (
                  <GroupCard
                    group={group}
                    onPress={() => router.push(`/group/${group.id}`)}
                  />
                )}
              />
            </>
          )}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={closeModal}>
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable className="flex-1 justify-end bg-black/70" onPress={closeModal}>
            <Pressable
              className="rounded-t-3xl bg-charcoal-900 px-6 pt-6"
              style={{
                paddingBottom: keyboardHeight > 0 ? keyboardHeight + 16 : insets.bottom + 24,
              }}
              onPress={(e) => e.stopPropagation()}
            >
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
                className="mb-4 flex-row items-center gap-3 py-2"
                accessibilityRole="checkbox"
                accessibilityState={{ checked: isTemporary }}
              >
                <View
                  className={`h-6 w-6 rounded-md border ${isTemporary ? 'border-responder bg-responder' : 'border-charcoal-500'}`}
                />
                <Text variant="body">Temporary group (expires in 1 hour)</Text>
              </Pressable>
              <CreateGroupEmergencyTypesPicker
                mode={createEmergencyMode}
                onModeChange={setCreateEmergencyMode}
                selected={createEmergencyTypes}
                onSelectedChange={(types) => setCreateEmergencyTypes(new Set(types))}
                onToggle={(code) => {
                  setCreateEmergencyTypes((prev) => {
                    const next = new Set(prev);
                    if (next.has(code)) next.delete(code);
                    else next.add(code);
                    return next;
                  });
                }}
              />
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
