import { GlassCard } from "@/components/ui/GlassCard";
import { Text } from "@/components/ui/Text";
import { useGroups } from "@/hooks/useGroups";
import { Ionicons } from "@expo/vector-icons";
import { ScrollView, View } from "react-native";

export function NearbyResponders() {
  const { data: groups } = useGroups();
  const items = groups?.slice(0, 4) ?? [];

  return (
    <View>
      <Text variant="label" className="mb-3">
        Trusted groups
      </Text>
      {items.length === 0 ? (
        <Text variant="caption" muted>
          Create a group to alert trusted contacts when you need help.
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-3">
          {items.map((group) => (
            <GlassCard key={group.id} className="mr-3 w-36">
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
          ))}
        </ScrollView>
      )}
    </View>
  );
}
