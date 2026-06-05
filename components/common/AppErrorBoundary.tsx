import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { captureException } from '@/lib/observability';
import { useEffect } from 'react';
import { View } from 'react-native';
import type { ErrorBoundaryProps } from 'expo-router';

export function AppErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    void captureException(error, { boundary: 'AppErrorBoundary' });
  }, [error]);

  return (
    <View className="flex-1 items-center justify-center bg-charcoal-950 px-8">
      <Text variant="title" className="mb-3 text-center">
        Something went wrong
      </Text>
      <Text variant="body" muted className="mb-8 text-center leading-relaxed">
        The app hit an unexpected error. Try again — your account and settings are safe.
      </Text>
      <Button title="Try again" onPress={retry} />
    </View>
  );
}
