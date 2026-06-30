import { Text } from '@/components/ui/Text';
import { fallbackEmergencyTypes } from '@/hooks/useEmergencyCatalog';
import { getEmergencyTypeLabel } from '@/lib/emergencyTypeLabels';
import { getEmergencyTypeColors } from '@/lib/emergencyTypeColors';
import type { EmergencyType } from '@/types';
import { View } from 'react-native';

interface EmergencyTypeSummaryProps {
  types?: EmergencyType[];
  /** Max chips before "+N more" */
  maxVisible?: number;
  size?: 'sm' | 'md';
}

export function EmergencyTypeSummary({
  types,
  maxVisible = 4,
  size = 'sm',
}: EmergencyTypeSummaryProps) {
  const configured = types ?? [];
  const allCodes = fallbackEmergencyTypes.map((t) => t.code as EmergencyType);

  if (configured.length === 0) {
    return (
      <View
        className={`self-start rounded-full bg-responder/15 ${
          size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1'
        }`}
      >
        <Text variant="caption" className="text-responder-light">
          All emergencies
        </Text>
      </View>
    );
  }

  const visible = configured.slice(0, maxVisible);
  const overflow = configured.length - visible.length;

  return (
    <View className="flex-row flex-wrap gap-1.5">
      {visible.map((code) => {
        const colors = getEmergencyTypeColors(code);
        return (
          <View
            key={code}
            style={{ backgroundColor: colors.surface }}
            className={`rounded-full ${size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1'}`}
          >
            <Text
              variant="caption"
              style={{ color: colors.glow }}
              className={size === 'sm' ? 'text-xs' : ''}
            >
              {getEmergencyTypeLabel(code)}
            </Text>
          </View>
        );
      })}
      {overflow > 0 ? (
        <View className={`rounded-full bg-charcoal-800 ${size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1'}`}>
          <Text variant="caption" muted>
            +{overflow}
          </Text>
        </View>
      ) : null}
      {configured.length === allCodes.length ? (
        <View className={`rounded-full bg-charcoal-800 ${size === 'sm' ? 'px-2 py-0.5' : 'px-3 py-1'}`}>
          <Text variant="caption" muted>
            (all types)
          </Text>
        </View>
      ) : null}
    </View>
  );
}
