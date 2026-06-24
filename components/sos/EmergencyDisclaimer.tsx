import { Text } from '@/components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

interface EmergencyDisclaimerProps {
  compact?: boolean;
  className?: string;
}

export function EmergencyDisclaimer({ compact = false, className = '' }: EmergencyDisclaimerProps) {
  return (
    <View
      className={`rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 ${className}`}
      accessibilityRole="text"
    >
      <View className="flex-row items-start gap-2">
        <Ionicons name="warning-outline" size={compact ? 16 : 18} color="#c9a04a" />
        <Text variant={compact ? 'caption' : 'body'} className="flex-1 text-warning">
          {compact
            ? 'YouHooAlert is not a replacement for emergency services (999/911/112). Call emergency services if you are in immediate danger.'
            : 'YouHooAlert is not a replacement for emergency services. If you are in immediate danger, call 999, 911, or 112 first. This app notifies your trusted circle — it does not dispatch professional emergency responders.'}
        </Text>
      </View>
    </View>
  );
}
