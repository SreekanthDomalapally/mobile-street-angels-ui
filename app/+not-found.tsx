import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { Stack, router } from 'expo-router';
import { View } from 'react-native';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Not found' }} />
      <View className="flex-1 items-center justify-center bg-charcoal-950 px-8">
        <Text variant="title" className="mb-3 text-center">
          Screen not found
        </Text>
        <Text variant="body" muted className="mb-8 text-center">
          This route does not exist in YouHoo Alert.
        </Text>
        <Button title="Go home" onPress={() => router.replace('/')} />
      </View>
    </>
  );
}
