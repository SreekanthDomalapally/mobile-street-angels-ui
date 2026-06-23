import { Text } from '@/components/ui/Text';
import { useGroups } from '@/hooks/useGroups';
import { formatGroupSubtitle } from '@/lib/groupLabels';
import { useSettingsStore } from '@/stores/settingsStore';
import type { Group } from '@/types';
import { Pressable, ScrollView, View } from 'react-native';

function pickDefaultGroup(groups: Group[], preferredId?: string | null): Group | undefined {
  if (preferredId) {
    const match = groups.find((g) => g.id === preferredId);
    if (match) return match;
  }
  return groups[0];
}

export function SosGroupPicker() {
  const { data: groups } = useGroups();
  const defaultGroupId = useSettingsStore((s) => s.emergency.defaultSosGroupId);
  const setDefaultGroupId = useSettingsStore((s) => s.setDefaultSosGroupId);

  if (!groups?.length) return null;

  const selected = pickDefaultGroup(groups, defaultGroupId) ?? groups[0];

  if (groups.length === 1) {
    return (
      <View className="mb-4 rounded-2xl border border-glass-border bg-charcoal-900 px-4 py-3">
        <Text variant="caption" muted>
          SOS will notify
        </Text>
        <Text variant="body">{selected.name}</Text>
        <Text variant="caption" muted className="mt-1">
          {formatGroupSubtitle(selected)}
        </Text>
      </View>
    );
  }

  return (
    <View className="mb-4">
      <Text variant="label" className="mb-1">
        Notify circle
      </Text>
      <Text variant="caption" muted className="mb-2">
        Each circle is private. Pick who receives this SOS.
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {groups.map((group) => {
          const active = group.id === selected.id;
          return (
            <Pressable
              key={group.id}
              onPress={() => setDefaultGroupId(group.id)}
              className={`mr-2 max-w-[220px] rounded-2xl border px-4 py-3 ${active ? 'border-responder bg-responder/15' : 'border-glass-border bg-charcoal-900'}`}
              accessibilityRole="radio"
              accessibilityState={{ selected: active }}
              accessibilityLabel={`Notify ${group.name}, ${formatGroupSubtitle(group)}`}>
              <Text variant="body" numberOfLines={1}>
                {group.name}
              </Text>
              <Text variant="caption" muted className="mt-1" numberOfLines={2}>
                {formatGroupSubtitle(group)}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export function getSelectedSosGroupId(groups: Group[], preferredId?: string | null): string | undefined {
  return pickDefaultGroup(groups, preferredId)?.id;
}
