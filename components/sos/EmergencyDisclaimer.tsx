import {
  EMERGENCY_SERVICES_DISCLAIMER,
  EMERGENCY_SERVICES_DISCLAIMER_COMPACT,
} from '@/lib/emergencyDial';
import { Text } from '@/components/ui/Text';
import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

interface EmergencyDisclaimerProps {
  compact?: boolean;
  className?: string;
}

export function EmergencyDisclaimer({ compact = false, className = '' }: EmergencyDisclaimerProps) {
  const text = compact
    ? `${EMERGENCY_SERVICES_DISCLAIMER} ${EMERGENCY_SERVICES_DISCLAIMER_COMPACT}`
    : `${EMERGENCY_SERVICES_DISCLAIMER} ${EMERGENCY_SERVICES_DISCLAIMER_COMPACT}`;

  return (
    <View
      className={`rounded-2xl border border-warning/30 bg-warning/10 px-4 py-3 ${className}`}
      accessibilityRole="text"
    >
      <View className="flex-row items-start gap-2">
        <Ionicons name="warning-outline" size={compact ? 16 : 18} color="#c9a04a" />
        <Text variant={compact ? 'caption' : 'body'} className="flex-1 text-warning">
          {text}
        </Text>
      </View>
    </View>
  );
}
