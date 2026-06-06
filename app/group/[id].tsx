import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Text } from '@/components/ui/Text';
import { useGroups } from '@/hooks/useGroups';
import { useSettingsStore } from '@/stores/settingsStore';
import { router, useLocalSearchParams } from 'expo-router';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GroupDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { data: groups, isLoading, isError, refetch } = useGroups();
  const defaultGroupId = useSettingsStore((s) => s.emergency.defaultSosGroupId);
  const setDefaultGroupId = useSettingsStore((s) => s.setDefaultSosGroupId);

  const group = groups?.find((g) => g.id === id);

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
    <View
      className="flex-1 bg-charcoal-950 px-5"
      style={{ paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }}>
      <Text variant="title" className="mb-2">
        {group.name}
      </Text>
      <Text variant="body" muted className="mb-6">
        {group.isTemporary ? 'Temporary trusted circle' : 'Trusted circle for SOS alerts'}
      </Text>

      <GlassCard className="mb-6">
        <Text variant="label" className="mb-2">
          Details
        </Text>
        <Text variant="caption" muted>
          Members: {group.memberCount || 'You + invited contacts'}
        </Text>
        {group.expiresAt && (
          <Text variant="caption" muted className="mt-1">
            Expires: {new Date(group.expiresAt).toLocaleString()}
          </Text>
        )}
      </GlassCard>

      <Button
        title={isDefault ? 'Default SOS group' : 'Set as default SOS group'}
        variant={isDefault ? 'secondary' : 'primary'}
        disabled={isDefault}
        onPress={() => setDefaultGroupId(group.id)}
      />
      <Button title="Back to groups" variant="ghost" onPress={() => router.back()} className="mt-3" />
    </View>
  );
}
