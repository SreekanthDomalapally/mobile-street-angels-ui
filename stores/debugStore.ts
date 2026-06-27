import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

const REQUIRED_TAPS = 7;

interface DebugState {
  unlocked: boolean;
  setUnlocked: (value: boolean) => void;
}

export const useDebugStore = create<DebugState>()(
  persist(
    (set) => ({
      unlocked: false,
      setUnlocked: (value) => set({ unlocked: value }),
    }),
    {
      name: 'street-angels-debug',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

/**
 * Debug tools are available in development builds automatically, or in
 * release/internal-testing builds once unlocked via the hidden tap gesture.
 */
export function areDebugToolsEnabled(unlocked: boolean): boolean {
  return __DEV__ || unlocked;
}

export const DEBUG_UNLOCK_TAPS = REQUIRED_TAPS;
