import { Text } from '@/components/ui/Text';
import { fallbackEmergencyTypes, useEmergencyTypes } from '@/hooks/useEmergencyCatalog';
import { getEmergencyTypeIcon } from '@/lib/emergencyTypeIcons';
import { getEmergencyTypeLabel } from '@/lib/emergencyTypeLabels';
import { getEmergencyTypeColors } from '@/lib/emergencyTypeColors';
import type { EmergencyType } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';

interface EmergencyTypeChipGridProps {
  selected: Set<EmergencyType>;
  onToggle: (code: EmergencyType) => void;
  disabled?: boolean;
}

export function EmergencyTypeChipGrid({
  selected,
  onToggle,
  disabled = false,
}: EmergencyTypeChipGridProps) {
  const { data: catalog } = useEmergencyTypes();
  const types = catalog ?? fallbackEmergencyTypes;

  return (
    <View className="flex-row flex-wrap justify-between gap-y-2">
      {types.map((type) => {
        const code = type.code as EmergencyType;
        const isSelected = selected.has(code);
        const colors = getEmergencyTypeColors(code);
        const label = getEmergencyTypeLabel(code);

        return (
          <Pressable
            key={type.code}
            onPress={() => {
              if (disabled) return;
              Haptics.selectionAsync();
              onToggle(code);
            }}
            disabled={disabled}
            style={{
              borderColor: isSelected ? colors.border : undefined,
              backgroundColor: isSelected ? colors.surface : undefined,
            }}
            className={`min-h-[52px] w-[48%] flex-row items-center gap-2 rounded-2xl border px-3 py-2.5 ${
              isSelected ? '' : 'border-glass-border bg-charcoal-800'
            } ${disabled ? 'opacity-50' : ''}`}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: isSelected }}
            accessibilityLabel={label}
          >
            <Ionicons
              name={getEmergencyTypeIcon(type.icon)}
              size={20}
              color={isSelected ? colors.glow : colors.muted}
            />
            <Text
              variant="body"
              numberOfLines={1}
              style={isSelected ? { color: colors.glow } : undefined}
              className="min-w-0 flex-1 shrink"
            >
              {label}
            </Text>
            {isSelected ? (
              <Ionicons name="checkmark-circle" size={18} color={colors.glow} />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
