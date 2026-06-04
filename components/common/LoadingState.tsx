import { ActivityIndicator, View } from 'react-native';
import { Text } from '@/components/ui/Text';
import { colors } from '@/constants/theme';

interface LoadingStateProps {
  message?: string;
  fullScreen?: boolean;
}

export function LoadingState({ message = 'Loading…', fullScreen }: LoadingStateProps) {
  return (
    <View
      className={`items-center justify-center ${fullScreen ? 'flex-1 bg-charcoal-950' : 'py-12'}`}
      accessibilityLabel={message}
      accessibilityLiveRegion="polite">
      <ActivityIndicator size="large" color={colors.emergency} />
      <Text variant="caption" muted className="mt-4">
        {message}
      </Text>
    </View>
  );
}
