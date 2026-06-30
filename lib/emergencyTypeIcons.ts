import { Ionicons } from '@expo/vector-icons';

export const emergencyTypeIconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  medkit: 'medkit-outline',
  shield: 'shield-outline',
  car: 'car-outline',
  'hand-left': 'hand-left-outline',
  compass: 'compass-outline',
  'ellipsis-horizontal': 'ellipsis-horizontal-circle-outline',
};

export function getEmergencyTypeIcon(icon: string): keyof typeof Ionicons.glyphMap {
  return emergencyTypeIconMap[icon] ?? 'help-circle-outline';
}
