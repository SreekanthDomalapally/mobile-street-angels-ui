import { ActivityCard } from "@/components/activity/ActivityCard";
import { EmptyState } from "@/components/common/EmptyState";
import { ErrorState } from "@/components/common/ErrorState";
import { LoadingState } from "@/components/common/LoadingState";
import { Text } from "@/components/ui/Text";
import { useActivity } from "@/hooks/useActivity";
import { useFocusEffect } from "expo-router";
import { useCallback } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const { data: items, isLoading, isError, refetch, isRefetching } = useActivity();

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch])
  );

  return (
    <View className="flex-1 bg-charcoal-950">
      <View className="px-5" style={{ paddingTop: insets.top + 16 }}>
        <Text variant="title">Activity</Text>
        <Text variant="body" muted className="mt-1">
          Your safety timeline
        </Text>
      </View>

      {isLoading && !isRefetching && <LoadingState message="Loading activity…" />}
      {isError && <ErrorState onRetry={() => refetch()} />}
      {!isLoading && !isError && (
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 100,
            paddingTop: 20,
          }}
          showsVerticalScrollIndicator={false}
        >
          {(items?.length ?? 0) === 0 ? (
            <EmptyState
              icon="time-outline"
              title="No activity yet"
              description="SOS alerts you send or receive in your trusted groups will appear here."
            />
          ) : (
            items?.map((item) => <ActivityCard key={item.id} item={item} />)
          )}
        </ScrollView>
      )}
    </View>
  );
}
