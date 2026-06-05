import { ActivityCard } from "@/components/activity/ActivityCard";
import { EmptyState } from "@/components/common/EmptyState";
import { Text } from "@/components/ui/Text";
import { mockActivity } from "@/data/mock";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const items = mockActivity;

  return (
    <View className="flex-1 bg-charcoal-950">
      <View className="px-5" style={{ paddingTop: insets.top + 16 }}>
        <Text variant="title">Activity</Text>
        <Text variant="body" muted className="mt-1">
          Your safety timeline
        </Text>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
          paddingTop: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {items.length === 0 ? (
          <EmptyState
            icon="time-outline"
            title="No activity yet"
            description="Past alerts and check-ins will appear here."
          />
        ) : (
          items.map((item) => <ActivityCard key={item.id} item={item} />)
        )}
      </ScrollView>
    </View>
  );
}
