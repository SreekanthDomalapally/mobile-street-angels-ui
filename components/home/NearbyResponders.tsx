import { GlassCard } from "@/components/ui/GlassCard";
import { Text } from "@/components/ui/Text";
import { useGroups } from "@/hooks/useGroups";
import { Ionicons } from "@expo/vector-icons";
import { type Href, router } from "expo-router";
import { Pressable, ScrollView, View } from "react-native";

export function NearbyResponders() {
  const { data: groups } = useGroups();
  const items = groups?.slice(0, 4) ?? [];

  return (
    <View>
      <Text variant="label" className="mb-3">
        Trusted groups
      </Text>
      {items.length === 0 ? (
        <Pressable
          onPress={() => router.push("/(tabs)/groups")}
          className="rounded-2xl border border-dashed border-glass-border px-4 py-5 active:bg-charcoal-900"
          accessibilityRole="button"
          accessibilityLabel="Create a trusted group"
        >
          <Text variant="body" className="text-center text-responder-light">
            Create a group to alert trusted contacts when you need help
          </Text>
        </Pressable>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-3">
          {items.map((group) => (
            <Pressable
              key={group.id}
              onPress={() => router.push(`/group/${group.id}` as Href)}
              accessibilityRole="button"
              accessibilityLabel={`Open ${group.name}`}
            >
              <GlassCard className="mr-3 w-36 active:opacity-90">
                <View className="items-center">
                  <View className="h-12 w-12 items-center justify-center rounded-full bg-responder/20">
                    <Ionicons name="people" size={24} color="#6bb892" />
                  </View>
                  <Text variant="caption" className="mt-2 text-center font-medium">
                    {group.name}
                  </Text>
                  <Text variant="label" muted className="mt-1 normal-case">
                    {group.isTemporary ? "Temporary" : "Trusted"}
                  </Text>
                </View>
              </GlassCard>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
