import { Text } from '@/components/ui/Text';
import type { CircleContact, Group } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';

interface CircleContactCardProps {
  contact: CircleContact;
  groups: Group[];
  onPress: () => void;
}

export function CircleContactCard({ contact, groups, onPress }: CircleContactCardProps) {
  const groupNames = contact.groupIds
    .map((groupId) => groups.find((group) => group.id === groupId)?.name)
    .filter((name): name is string => Boolean(name));

  return (
    <Pressable
      onPress={onPress}
      className="mb-3 rounded-2xl border border-glass-border bg-charcoal-900 p-4 active:opacity-90"
      accessibilityRole="button"
      accessibilityLabel={`Manage circles for ${contact.displayName}`}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="flex-1">
          <Text variant="body">{contact.displayName}</Text>
          <Text variant="caption" muted className="mt-1">
            {contact.email ?? contact.phone ?? 'No contact info'}
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#6d6d75" />
      </View>

      <View className="mt-3 flex-row flex-wrap gap-2">
        {groupNames.length > 0 ? (
          groupNames.map((name) => (
            <View key={name} className="rounded-full bg-responder/15 px-3 py-1">
              <Text variant="caption" className="text-responder-light">
                {name}
              </Text>
            </View>
          ))
        ) : (
          <Text variant="caption" muted>
            No circles yet
          </Text>
        )}
      </View>

      <Text variant="label" muted className="mt-3 normal-case">
        {contact.onPlatform
          ? contact.status === 'invited'
            ? 'Invite sent — waiting for acceptance'
            : 'On YouHoo Alert'
          : 'Invite to install sent'}
      </Text>
    </Pressable>
  );
}
