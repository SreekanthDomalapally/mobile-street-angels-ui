import type { EmergencyType } from '@/types';

export type EmergencyPresetId = 'all' | 'health' | 'travel' | 'custom';

export interface EmergencyPreset {
  id: EmergencyPresetId;
  label: string;
  subtitle: string;
  types: EmergencyType[] | null;
}

export const EMERGENCY_PRESETS: EmergencyPreset[] = [
  {
    id: 'all',
    label: 'All SOS alerts',
    subtitle: 'Recommended — notify for every emergency',
    types: [],
  },
  {
    id: 'health',
    label: 'Health & safety',
    subtitle: 'Medical and personal safety',
    types: ['medical', 'personal_safety'],
  },
  {
    id: 'travel',
    label: 'Travel & rides',
    subtitle: 'Pickup, breakdown, or lost',
    types: ['need_pickup', 'car_breakdown', 'lost_or_stranded'],
  },
  {
    id: 'custom',
    label: 'Choose types',
    subtitle: 'Pick exactly which alerts this group gets',
    types: null,
  },
];

export function presetFromTypes(types: EmergencyType[]): EmergencyPresetId {
  if (types.length === 0) return 'all';
  const sorted = [...types].sort().join(',');
  for (const preset of EMERGENCY_PRESETS) {
    if (preset.types && [...preset.types].sort().join(',') === sorted) {
      return preset.id;
    }
  }
  return 'custom';
}

export function typesForPreset(
  presetId: EmergencyPresetId,
  customSelection: Set<EmergencyType>
): EmergencyType[] {
  const preset = EMERGENCY_PRESETS.find((p) => p.id === presetId);
  if (!preset) return [];
  if (presetId === 'custom') return Array.from(customSelection);
  return preset.types ?? [];
}

/** Quick group name suggestions (WhatsApp-style). */
export const GROUP_NAME_SUGGESTIONS = [
  'Family',
  'Friends',
  'Work',
  'Neighbors',
  'Golf Tour',
  'Night Out',
] as const;
