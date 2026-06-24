import type { EmergencyType } from '@/types';

export interface EmergencyTypeColors {
  primary: string;
  glow: string;
  muted: string;
  surface: string;
  surfaceStrong: string;
  border: string;
  ring: string;
  ringOuter: string;
}

function palette(
  primary: string,
  glow: string,
  muted: string,
): EmergencyTypeColors {
  return {
    primary,
    glow,
    muted,
    surface: `${primary}26`,
    surfaceStrong: `${primary}40`,
    border: `${primary}80`,
    ring: `${primary}1A`,
    ringOuter: `${primary}33`,
  };
}

export const emergencyTypeColors: Record<EmergencyType, EmergencyTypeColors> = {
  medical: palette('#c94a4a', '#e85d5d', '#8b3a3a'),
  personal_safety: palette('#9333ea', '#c084fc', '#6b21a8'),
  car_breakdown: palette('#d97706', '#fbbf24', '#92400e'),
  need_pickup: palette('#2563eb', '#60a5fa', '#1d4ed8'),
  lost_or_stranded: palette('#0d9488', '#2dd4bf', '#0f766e'),
  custom: palette('#64748b', '#94a3b8', '#475569'),
};

export function getEmergencyTypeColors(type: EmergencyType): EmergencyTypeColors {
  return emergencyTypeColors[type] ?? emergencyTypeColors.custom;
}
