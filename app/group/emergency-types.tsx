import { GroupEmergencyTypesSection } from '@/components/groups/GroupEmergencyTypesSection';
import { Text } from '@/components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function GroupEmergencyTypesScreen() {
  const insets = useSafeAreaInsets();
  const { groupId, name } = useLocalSearchParams<{ groupId: string; name?: string }>();

  if (!groupId) {
    return null;
  }

  return (
    <ScrollView
      className="flex-1 bg-charcoal-950"
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: 20,
      }}
    >
      <View className="mb-6 flex-row items-center gap-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-xl bg-charcoal-800"
        >
          <Ionicons name="chevron-back" size={22} color="#a0a0a8" />
        </Pressable>
        <View className="flex-1">
          <Text variant="title">Emergency types</Text>
          {name ? (
            <Text variant="caption" muted>
              {name}
            </Text>
          ) : null}
        </View>
      </View>

      <GroupEmergencyTypesSection groupId={groupId} canEdit onSaved={() => router.back()} />
    </ScrollView>
  );
}
