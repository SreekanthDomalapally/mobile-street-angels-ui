/**
 * SOS debug UI (Profile row, /debug/sos) is compiled into all builds but gated by flags:
 *
 * - `__DEV__` — always on (local dev / dev client)
 * - `EXPO_PUBLIC_ENABLE_SOS_DEBUG=true` — internal/preview builds; unlock via 7-tap on Profile
 * - production Play Store — leave unset or `false` (debug hidden unless you flip the flag and rebuild)
 */

function readEnvFlag(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === 'true';
}

/** Build includes the debug feature (dev client or explicit env flag). */
export function isSosDebugCapable(): boolean {
  return __DEV__ || readEnvFlag(process.env.EXPO_PUBLIC_ENABLE_SOS_DEBUG);
}

/** Hidden gesture only when debug is capable but not already always-on (release + env flag). */
export function canUnlockSosDebugWithGesture(): boolean {
  return !__DEV__ && readEnvFlag(process.env.EXPO_PUBLIC_ENABLE_SOS_DEBUG);
}

/** Whether SOS debug tools should be visible/interactive. */
export function areDebugToolsEnabled(unlocked: boolean): boolean {
  if (__DEV__) {
    return true;
  }
  if (!readEnvFlag(process.env.EXPO_PUBLIC_ENABLE_SOS_DEBUG)) {
    return false;
  }
  return unlocked;
}

export const DEBUG_UNLOCK_TAPS = 7;
