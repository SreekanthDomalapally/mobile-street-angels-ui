import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import type { SOSReadiness } from '@/lib/sosReadiness';
import { router } from 'expo-router';
import { View } from 'react-native';

interface ReadinessBannerProps {
  readiness: SOSReadiness;
}

export function ReadinessBanner({ readiness }: ReadinessBannerProps) {
  if (readiness.ready) {
    return (
      <View className="mb-4 rounded-2xl border border-responder/30 bg-responder/10 p-4">
        <Text variant="body" className="text-responder-light">
          You are protected. Your trusted circle can respond when you send an SOS.
        </Text>
      </View>
    );
  }

  return (
    <View className="mb-4 rounded-2xl border border-warning/30 bg-warning/10 p-4">
      <Text variant="body" className="mb-3 text-warning">
        {readiness.reason}
      </Text>
      {readiness.ctaHref && readiness.ctaLabel && (
        <Button
          title={readiness.ctaLabel}
          size="sm"
          variant="secondary"
          onPress={() => router.push(readiness.ctaHref as never)}
        />
      )}
    </View>
  );
}
