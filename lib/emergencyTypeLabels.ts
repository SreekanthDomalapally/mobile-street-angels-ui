import type { EmergencyType } from '@/types';

/** Short one-word labels for tight UI chips (SOS picker, group settings). */
export const emergencyTypeLabels: Record<EmergencyType, string> = {
  medical: 'Medical',
  personal_safety: 'Safety',
  car_breakdown: 'Breakdown',
  need_pickup: 'Pickup',
  lost_or_stranded: 'Lost',
  custom: 'Custom',
};

export function getEmergencyTypeLabel(code: EmergencyType): string {
  return emergencyTypeLabels[code] ?? 'Custom';
}
