import { BRAND_NAVY } from '@/constants/branding';

export const colors = {
  background: BRAND_NAVY,
  surface: '#0F2442',
  surfaceElevated: '#152E52',
  text: '#f5f5f7',
  textMuted: '#a0a0a8',
  textSubtle: '#6d6d75',
  emergency: '#c94a4a',
  emergencyGlow: '#e85d5d',
  emergencyMuted: '#8b3a3a',
  responder: '#4a8f6a',
  responderLight: '#6bb892',
  border: 'rgba(255,255,255,0.1)',
  glass: 'rgba(255,255,255,0.08)',
  glassBorder: 'rgba(255,255,255,0.12)',
  success: '#4a8f6a',
  warning: '#c9a04a',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const typography = {
  hero: { fontSize: 32, fontWeight: '700' as const, lineHeight: 40 },
  title: { fontSize: 24, fontWeight: '600' as const, lineHeight: 32 },
  subtitle: { fontSize: 18, fontWeight: '500' as const, lineHeight: 26 },
  body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
  caption: { fontSize: 14, fontWeight: '400' as const, lineHeight: 20 },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
    letterSpacing: 0.5,
  },
} as const;

export const sosConfig = {
  holdDurationMs: 2000,
  countdownSeconds: 3,
  minTapTarget: 56,
} as const;
