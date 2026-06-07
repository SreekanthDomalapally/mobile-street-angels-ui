import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { ActivityIndicator, View } from 'react-native';

export default function GroupDetailRedirect() {
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      router.replace(`/(tabs)/groups?selected=${id}`);
      return;
    }
    router.replace('/(tabs)/groups');
  }, [id]);

  return (
    <View className="flex-1 items-center justify-center bg-charcoal-950">
      <ActivityIndicator color="#6bb892" />
    </View>
  );
}
