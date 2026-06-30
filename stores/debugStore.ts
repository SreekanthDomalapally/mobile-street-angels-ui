import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

export { areDebugToolsEnabled, canUnlockSosDebugWithGesture, DEBUG_UNLOCK_TAPS } from '@/lib/debugFlags';

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
