import { AddContactModal } from '@/components/groups/AddContactModal';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Text } from '@/components/ui/Text';
import { useGroup } from '@/hooks/useGroup';
import { useSettingsStore } from '@/stores/settingsStore';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: group, isLoading, isError, refetch } = useGroup(id);
  const defaultGroupId = useSettingsStore((s) => s.emergency.defaultSosGroupId);
  const setDefaultGroupId = useSettingsStore((s) => s.setDefaultSosGroupId);
  const [showAddContact, setShowAddContact] = useState(false);

  if (isLoading) return <LoadingState message="Loading group…" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  if (!group) {
    return (
      <View className="flex-1 bg-charcoal-950 px-5" style={{ paddingTop: insets.top + 24 }}>
        <Text variant="body">Group not found.</Text>
        <Button title="Back" variant="ghost" onPress={() => router.back()} className="mt-4" />
      </View>
    );
  }

  const isDefault = defaultGroupId === group.id;

  return (
    <View className="flex-1 bg-charcoal-950">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 24,
          paddingHorizontal: 20,
        }}>
        <Text variant="title" className="mb-2">
          {group.name}
        </Text>
        <Text variant="body" muted className="mb-6">
          {group.isTemporary ? 'Temporary trusted circle' : 'Trusted circle for SOS alerts'}
        </Text>

        <GlassCard className="mb-6">
          <Text variant="label" className="mb-2">
            How location works
          </Text>
          <Text variant="caption" muted className="leading-relaxed">
            Your live location is shared only with people in this circle during an active SOS alert.
            Add family and friends here so they can respond when you need help.
          </Text>
        </GlassCard>

        <View className="mb-4 flex-row items-center justify-between">
          <Text variant="label">Members ({group.memberCount})</Text>
          <Button title="+ Add" size="sm" variant="secondary" onPress={() => setShowAddContact(true)} />
        </View>

        {group.members.length === 0 ? (
          <Text variant="body" muted className="mb-6">
            No members yet. Add contacts from your phone to build your trusted circle.
          </Text>
        ) : (
          <View className="mb-6 gap-2">
            {group.members.map((member) => (
              <View
                key={member.userId}
                className="rounded-2xl border border-glass-border bg-charcoal-900 px-4 py-3">
                <Text variant="body">{member.displayName}</Text>
                <Text variant="caption" muted>
                  {member.email} · {member.role}
                </Text>
              </View>
            ))}
          </View>
        )}

        <Button
          title={isDefault ? 'Default SOS group' : 'Set as default SOS group'}
          variant={isDefault ? 'secondary' : 'primary'}
          disabled={isDefault}
          onPress={() => setDefaultGroupId(group.id)}
        />
        <Button title="Back to groups" variant="ghost" onPress={() => router.back()} className="mt-3" />
      </ScrollView>

      <AddContactModal
        visible={showAddContact}
        groupId={group.id}
        groupName={group.name}
        existingMemberIds={group.members.map((m) => m.userId)}
        existingEmails={group.members.map((m) => m.email)}
        onClose={() => setShowAddContact(false)}
        onUpdated={() => refetch()}
      />
    </View>
  );
}
