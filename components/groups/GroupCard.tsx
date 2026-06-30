import { EmergencyTypeSummary } from "@/components/groups/EmergencyTypeSummary";
import { Text } from "@/components/ui/Text";
import { formatGroupSubtitle } from "@/lib/groupLabels";
import type { Group } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

interface GroupCardProps {
  group: Group;
  selected?: boolean;
  onPress?: () => void;
}

export function GroupCard({ group, selected = false, onPress }: GroupCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className={`mb-3 flex-row items-center gap-4 rounded-2xl border p-4 active:bg-charcoal-800 ${
        selected ? 'border-responder bg-responder/10' : 'border-glass-border bg-charcoal-900'
      }`}
      accessibilityRole="button"
      accessibilityLabel={`${group.name}, ${group.memberCount} members`}
    >
      <View
        className="h-12 w-12 items-center justify-center rounded-2xl"
        style={{ backgroundColor: (group.color ?? "#4a8f6a") + "33" }}
      >
        <Ionicons name="people" size={24} color={group.color ?? "#4a8f6a"} />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center gap-2">
          <Text variant="subtitle">{group.name}</Text>
          {group.isTemporary && (
            <View className="rounded-full bg-warning/20 px-2 py-0.5">
              <Text variant="label" className="normal-case text-warning">
                Temporary
              </Text>
            </View>
          )}
        </View>
        <Text variant="caption" muted>
          {formatGroupSubtitle(group)}
        </Text>
        <View className="mt-2">
          <EmergencyTypeSummary types={group.emergencyTypes} maxVisible={3} />
        </View>
      </View>
      {selected ? (
        <Ionicons name="checkmark-circle" size={22} color="#6bb892" />
      ) : (
        <Ionicons name="ellipse-outline" size={20} color="#6d6d75" />
      )}
    </Pressable>
  );
}
