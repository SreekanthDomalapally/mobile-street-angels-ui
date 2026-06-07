import { Text } from '@/components/ui/Text';
import type { Group } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

interface GroupMultiSelectProps {
  groups: Group[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  disabled?: boolean;
}

export function GroupMultiSelect({
  groups,
  selectedIds,
  onChange,
  disabled = false,
}: GroupMultiSelectProps) {
  if (groups.length === 0) {
    return (
      <Text variant="body" muted className="py-4 text-center">
        Create a trusted circle first to add contacts.
      </Text>
    );
  }

  const toggle = (groupId: string) => {
    if (disabled) return;
    if (selectedIds.includes(groupId)) {
      onChange(selectedIds.filter((id) => id !== groupId));
      return;
    }
    onChange([...selectedIds, groupId]);
  };

  return (
    <View className="gap-2">
      {groups.map((group) => {
        const selected = selectedIds.includes(group.id);
        return (
          <Pressable
            key={group.id}
            onPress={() => toggle(group.id)}
            disabled={disabled}
            className={`min-h-[48px] flex-row items-center justify-between rounded-2xl border px-4 py-3 ${
              selected ? 'border-responder/50 bg-responder/15' : 'border-glass-border bg-charcoal-900'
            } ${disabled ? 'opacity-50' : ''}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: selected }}>
            <View className="flex-1 pr-3">
              <Text variant="body">{group.name}</Text>
              <Text variant="caption" muted className="mt-1">
                {group.isTemporary ? 'Temporary circle' : 'Trusted circle'} · {group.memberCount} members
              </Text>
            </View>
            <Ionicons
              name={selected ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={selected ? '#6bb892' : '#6d6d75'}
            />
          </Pressable>
        );
      })}
    </View>
  );
}
