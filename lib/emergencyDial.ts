import { Linking, Platform } from 'react-native';

/** ISO 3166-1 alpha-2 region → primary emergency number. */
const EMERGENCY_BY_REGION: Record<string, string> = {
  IE: '999',
  GB: '999',
  US: '911',
  CA: '911',
  AU: '000',
  NZ: '111',
  IN: '112',
  DE: '112',
  FR: '112',
  IT: '112',
  ES: '112',
  NL: '112',
  BE: '112',
  AT: '112',
  CH: '112',
  SE: '112',
  NO: '112',
  DK: '112',
  FI: '112',
  PT: '112',
  PL: '112',
  GR: '112',
  JP: '110',
  KR: '112',
  SG: '999',
  ZA: '10111',
  MX: '911',
  BR: '190',
};

const DEFAULT_EMERGENCY = '112';

/** Set EXPO_PUBLIC_EMERGENCY_DIAL_ENABLED=false to hide Call 999/911/112 during internal testing. */
export function isEmergencyDialEnabled(): boolean {
  const flag = process.env.EXPO_PUBLIC_EMERGENCY_DIAL_ENABLED?.trim().toLowerCase();
  return flag !== 'false' && flag !== '0';
}

/** Best-effort region from device locale (no extra native module). */
export function getDeviceRegion(): string {
  try {
    const locale =
      Platform.OS === 'ios'
        ? Intl.DateTimeFormat().resolvedOptions().locale
        : Intl.DateTimeFormat().resolvedOptions().locale;
    const match = locale.match(/[-_]([A-Z]{2})$/i);
    return match?.[1]?.toUpperCase() ?? 'IE';
  } catch {
    return 'IE';
  }
}

export function getEmergencyNumber(region?: string): string {
  const code = (region ?? getDeviceRegion()).toUpperCase();
  return EMERGENCY_BY_REGION[code] ?? DEFAULT_EMERGENCY;
}

export function getEmergencyDialUri(region?: string): string {
  return `tel:${getEmergencyNumber(region)}`;
}

export async function dialEmergencyServices(region?: string): Promise<void> {
  const uri = getEmergencyDialUri(region);
  const supported = await Linking.canOpenURL(uri);
  if (!supported) {
    throw new Error('Cannot open phone dialer on this device.');
  }
  await Linking.openURL(uri);
}

export function emergencyDialLabel(region?: string): string {
  return `Call ${getEmergencyNumber(region)}`;
}
