import type { EmergencyType } from '@/types';

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export type BloodGroup = (typeof BLOOD_GROUPS)[number];

export function showsMedicalProfileOnAlert(type: EmergencyType): boolean {
  return type === 'medical' || type === 'personal_safety';
}
