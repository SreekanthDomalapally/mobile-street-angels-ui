import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { CreateGroupWizard } from '@/components/groups/CreateGroupWizard';
import { GroupCard } from '@/components/groups/GroupCard';
import { GroupInvitesSection } from '@/components/groups/GroupInvitesSection';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useGroups } from '@/hooks/useGroups';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';

export default function GroupsScreen() {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const { selected: selectedParam } = useLocalSearchParams<{ selected?: string }>();
  const { data: groups, isLoading, isError, refetch } = useGroups();
  const [wizardVisible, setWizardVisible] = useState(false);

  useEffect(() => {
    if (typeof selectedParam === 'string' && selectedParam) {
      router.replace(`/group/${selectedParam}`);
    }
  }, [selectedParam]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
      queryClient.invalidateQueries({ queryKey: ['group-invites'] });
    }, [refetch, queryClient])
  );

  return (
    <View className="flex-1 bg-charcoal-950">
      <View
        className="flex-row items-center justify-between px-5"
        style={{ paddingTop: insets.top + 16 }}
      >
        <Text variant="title">Groups</Text>
        <Pressable
          onPress={() => setWizardVisible(true)}
          className="flex-row items-center gap-1.5 rounded-full bg-responder/20 px-4 py-2"
        >
          <Ionicons name="people" size={18} color="#6bb892" />
          <Text variant="caption" className="text-responder-light">
            New group
          </Text>
        </Pressable>
      </View>

      {isLoading && <LoadingState message="Loading groups…" />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && (
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: 16 }}
          showsVerticalScrollIndicator={false}
        >
          <GroupInvitesSection />

          {groups?.length === 0 ? (
            <EmptyState
              icon="people-outline"
              title="Create your first group"
              description="Pick people from your contacts, name the group, and you're done — just like WhatsApp."
              action={<Button title="New group" onPress={() => setWizardVisible(true)} />}
            />
          ) : (
            <>
              <Text variant="caption" muted className="mb-3">
                Tap a group to add people or change alert settings.
              </Text>
              <FlatList
                data={groups ?? []}
                keyExtractor={(g) => g.id}
                scrollEnabled={false}
                renderItem={({ item: group }) => (
                  <GroupCard group={group} onPress={() => router.push(`/group/${group.id}`)} />
                )}
              />
            </>
          )}
        </ScrollView>
      )}

      <CreateGroupWizard
        visible={wizardVisible}
        existingGroupNames={groups ?? []}
        onClose={() => setWizardVisible(false)}
        onCreated={(groupId) => {
          void refetch();
          router.push(`/group/${groupId}`);
        }}
      />
    </View>
  );
}
