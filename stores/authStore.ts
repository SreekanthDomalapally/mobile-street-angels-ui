import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { OnboardingStatus, User } from '@/types';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  hasVerifiedPhone: boolean;
  hasGrantedPermissions: boolean;
  onboarding: OnboardingStatus | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setOnboarding: (status: OnboardingStatus | null) => void;
  completeOnboarding: () => void;
  setPhoneVerified: (value: boolean) => void;
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
      hasVerifiedPhone: false,
      hasGrantedPermissions: false,
      onboarding: null,
      isLoading: true,
      setUser: (user) =>
        set({
          user,
          isAuthenticated: !!user,
          hasVerifiedPhone: Boolean(user?.phoneVerified),
        }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setOnboarding: (onboarding) =>
        set({
          onboarding,
          hasVerifiedPhone: onboarding ? !onboarding.needs_phone_verification : false,
        }),
      completeOnboarding: () => set({ hasCompletedOnboarding: true }),
      setPhoneVerified: (hasVerifiedPhone) => set({ hasVerifiedPhone }),
      setPermissionsGranted: (hasGrantedPermissions) => set({ hasGrantedPermissions }),
      setLoading: (isLoading) => set({ isLoading }),
      signOut: () =>
        set({
          user: null,
          isAuthenticated: false,
          onboarding: null,
        }),
    }),
    {
      name: 'street-angels-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        hasCompletedOnboarding: state.hasCompletedOnboarding,
        hasVerifiedPhone: state.hasVerifiedPhone,
        hasGrantedPermissions: state.hasGrantedPermissions,
      }),
    }
  )
);
