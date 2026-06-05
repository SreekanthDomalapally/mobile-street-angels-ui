import { Text } from "@/components/ui/Text";
import { formatRelativeTime } from "@/lib/utils";
import type { ActivityItem } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

const icons: Record<ActivityItem["type"], keyof typeof Ionicons.glyphMap> = {
  alert: "alert-circle-outline",
  check_in: "checkmark-circle-outline",
  group_update: "people-outline",
};

export function ActivityCard({ item }: { item: ActivityItem }) {
  return (
    <View className="mb-3 flex-row gap-4 rounded-2xl border border-glass-border bg-charcoal-900 p-4">
      <View className="h-10 w-10 items-center justify-center rounded-xl bg-charcoal-800">
        <Ionicons name={icons[item.type]} size={22} color="#a0a0a8" />
      </View>
      <View className="flex-1">
        <Text variant="body">{item.title}</Text>
        <Text variant="caption" muted>
          {item.subtitle}
        </Text>
        <Text variant="label" muted className="mt-2 normal-case">
          {formatRelativeTime(item.timestamp)}
        </Text>
      </View>
      {item.status === "resolved" && (
        <View className="rounded-full bg-responder/20 px-2 py-1">
          <Text variant="label" className="normal-case text-responder-light">
            Resolved
          </Text>
        </View>
      )}
    </View>
  );
}
