import { EmergencyTypeSummary } from "@/components/groups/EmergencyTypeSummary";
import { Text } from "@/components/ui/Text";
import { formatGroupSubtitle } from "@/lib/groupLabels";
import type { Group } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { Pressable, View } from "react-native";

interface GroupCardProps {
  group: Group;
  onPress?: () => void;
}

export function GroupCard({ group, onPress }: GroupCardProps) {
  return (
    <Pressable
      onPress={onPress}
      className="mb-3 flex-row items-center gap-4 rounded-2xl border border-glass-border bg-charcoal-900 p-4 active:bg-charcoal-800"
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
      {onPress ? (
        <Ionicons name="chevron-forward" size={20} color="#6d6d75" />
      ) : null}
    </Pressable>
  );
}
