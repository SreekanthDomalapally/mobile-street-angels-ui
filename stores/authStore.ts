import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  hasGrantedPermissions: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  completeOnboarding: () => void;
  setPermissionsGranted: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      hasGrantedPermissions: false,
      isLoading: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      setPermissionsGranted: (hasGrantedPermissions) => set({ hasGrantedPermissions }),
      setLoading: (isLoading) => set({ isLoading }),
      signOut: () =>
        set({
          user: null,
          isAuthenticated: false,
          hasCompletedOnboarding: false,
          hasGrantedPermissions: false,
        }),
    }),
    {
      name: 'street-angels-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        hasGrantedPermissions: state.hasGrantedPermissions,
      }),
    }
  )
);
