import * as Haptics from 'expo-haptics';
import { Pressable, ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { emergencyTypes } from '@/data/mock';
import { useSOSStore } from '@/stores/sosStore';
import type { EmergencyType } from '@/types';

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  medkit: 'medkit-outline',
  shield: 'shield-outline',
  'alert-circle': 'alert-circle-outline',
  car: 'car-outline',
  'help-circle': 'help-circle-outline',
};

export function EmergencyTypePicker() {
  const { emergencyType, setEmergencyType, status } = useSOSStore();
  const disabled = status !== 'idle';

  return (
    <View>
      <Text variant="label" className="mb-3 px-1">
        Emergency type
      </Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 px-1">
        {emergencyTypes.map((type) => {
          const selected = emergencyType === type.id;
          return (
            <Pressable
              key={type.id}
              onPress={() => {
                if (disabled) return;
                Haptics.selectionAsync();
                setEmergencyType(type.id as EmergencyType);
              }}
              disabled={disabled}
              className={`min-h-[48px] flex-row items-center gap-2 rounded-2xl border px-4 py-3 ${
                selected
                  ? 'border-emergency/50 bg-emergency/15'
                  : 'border-glass-border bg-charcoal-800'
              } ${disabled ? 'opacity-50' : ''}`}
              accessibilityRole="radio"
              accessibilityState={{ selected }}>
              <Ionicons
                name={iconMap[type.icon] ?? 'help-circle-outline'}
                size={20}
                color={selected ? '#e85d5d' : '#a0a0a8'}
              />
              <Text variant="body" className={selected ? 'text-emergency-glow' : ''}>
                {type.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
