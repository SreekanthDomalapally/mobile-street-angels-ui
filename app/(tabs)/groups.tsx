import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { TextInput, Modal, Pressable } from 'react-native';
import { GroupCard } from '@/components/groups/GroupCard';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { EmptyState } from '@/components/common/EmptyState';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import { useGroups } from '@/hooks/useGroups';

const groupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
});

type GroupForm = z.infer<typeof groupSchema>;

export default function GroupsScreen() {
  const insets = useSafeAreaInsets();
  const { data: groups, isLoading, isError, refetch } = useGroups();
  const [modalVisible, setModalVisible] = useState(false);
  const [isTemporary, setIsTemporary] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
    defaultValues: { name: '' },
  });

  const onCreate = (data: GroupForm) => {
    reset();
    setModalVisible(false);
    refetch();
  };

  return (
    <View className="flex-1 bg-charcoal-950">
      <View
        className="flex-row items-center justify-between px-5"
        style={{ paddingTop: insets.top + 16 }}>
        <Text variant="title">Groups</Text>
        <Button title="+ New" size="sm" variant="secondary" onPress={() => setModalVisible(true)} />
      </View>

      {isLoading && <LoadingState message="Loading groups…" />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && (
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}>
          {groups?.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="No groups yet"
              description="Create a trusted circle for emergencies and everyday safety."
              action={
                <Button title="Create group" onPress={() => setModalVisible(true)} />
              }
            />
          ) : (
            groups?.map((group) => (
              <GroupCard
                key={group.id}
                group={group}
                onPress={() => router.push({ pathname: '/alert/[id]', params: { id: group.id } })}
              />
            ))
          )}
        </ScrollView>
      )}

      <Modal visible={modalVisible} animationType="slide" transparent>
        <Pressable
          className="flex-1 justify-end bg-black/70"
          onPress={() => setModalVisible(false)}>
          <Pressable
            className="rounded-t-3xl bg-charcoal-900 px-6 pb-10 pt-6"
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
                  accessibilityLabel="Group name"
                />
              )}
            />
            {errors.name && (
              <Text variant="caption" className="mb-4 text-emergency">
                {errors.name.message}
              </Text>
            )}
            <Pressable
              onPress={() => setIsTemporary(!isTemporary)}
              className="mb-6 flex-row items-center gap-3 py-2">
              <View
                className={`h-6 w-6 rounded-md border ${isTemporary ? 'border-responder bg-responder' : 'border-charcoal-500'}`}
              />
              <Text variant="body">Temporary group (expires in 1 hour)</Text>
            </Pressable>
            <Button title="Create" onPress={handleSubmit(onCreate)} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
