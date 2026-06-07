import { ContactGroupsSheet } from '@/components/contacts/ContactGroupsSheet';
import { ContactPickerSheet } from '@/components/contacts/ContactPickerSheet';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Text } from '@/components/ui/Text';
import { useCircleContacts } from '@/hooks/useCircleContacts';
import { useGroup } from '@/hooks/useGroup';
import { useSettingsStore } from '@/stores/settingsStore';
import type { CircleContact } from '@/types';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: group, isLoading, isError, refetch } = useGroup(id);
  const { data: circleContacts } = useCircleContacts();
  const defaultGroupId = useSettingsStore((s) => s.emergency.defaultSosGroupId);
  const setDefaultGroupId = useSettingsStore((s) => s.setDefaultSosGroupId);
  const [showAddContact, setShowAddContact] = useState(false);
  const [editingContact, setEditingContact] = useState<CircleContact | null>(null);

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

        {(group.pendingInvites?.length ?? 0) > 0 && (
          <View className="mb-6 gap-2">
            <Text variant="label" className="mb-1">
              Pending invites
            </Text>
            {group.pendingInvites?.map((invite) => (
              <View
                key={invite.id}
                className="rounded-2xl border border-responder/20 bg-charcoal-900 px-4 py-3">
                <Text variant="body">{invite.inviteeEmail}</Text>
                <Text variant="caption" muted>
                  Invited by {invite.inviterName} · waiting for acceptance
                </Text>
              </View>
            ))}
          </View>
        )}

        {group.members.length === 0 ? (
          <Text variant="body" muted className="mb-6">
            No members yet. Add contacts from your phone to build your trusted circle.
          </Text>
        ) : (
          <View className="mb-6 gap-2">
            {group.members.map((member) => (
              <Pressable
                key={member.userId}
                onPress={() =>
                  setEditingContact(
                    circleContacts?.find((contact) => contact.userId === member.userId) ?? {
                      id: member.userId,
                      userId: member.userId,
                      displayName: member.displayName,
                      email: member.email,
                      groupIds: [group.id],
                      onPlatform: true,
                      status: 'member',
                    }
                  )
                }
                className="rounded-2xl border border-glass-border bg-charcoal-900 px-4 py-3 active:opacity-90">
                <Text variant="body">{member.displayName}</Text>
                <Text variant="caption" muted>
                  {member.email} · {member.role}
                </Text>
              </Pressable>
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

      <ContactPickerSheet
        visible={showAddContact}
        preselectedGroupIds={[group.id]}
        onClose={() => setShowAddContact(false)}
        onUpdated={() => refetch()}
      />

      <ContactGroupsSheet
        visible={editingContact !== null}
        contact={editingContact}
        preselectedGroupIds={[group.id]}
        onClose={() => setEditingContact(null)}
        onSaved={() => refetch()}
      />
    </View>
  );
}
