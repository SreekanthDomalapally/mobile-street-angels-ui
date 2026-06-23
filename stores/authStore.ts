import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { OnboardingFlags, OnboardingStatus, User } from '@/types';
import { computeOnboardingFlags } from '@/lib/onboarding';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  hasVerifiedPhone: boolean;
  hasGrantedPermissions: boolean;
  onboarding: OnboardingStatus | null;
  onboardingFlags: OnboardingFlags | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setAuthenticated: (value: boolean) => void;
  setOnboarding: (status: OnboardingStatus | null) => void;
  setOnboardingFlags: (flags: OnboardingFlags | null) => void;
  completeOnboarding: () => void;
  setPhoneVerified: (value: boolean) => void;
  setPermissionsGranted: (value: boolean) => void;
  setLoading: (value: boolean) => void;
  signOut: () => void;
}

function deriveFlags(state: {
  user: User | null;
  isAuthenticated: boolean;
  hasCompletedOnboarding: boolean;
  hasVerifiedPhone: boolean;
  hasGrantedPermissions: boolean;
  onboarding: OnboardingStatus | null;
}): OnboardingFlags {
  return computeOnboardingFlags({
    isAuthenticated: state.isAuthenticated,
    phoneVerified: Boolean(state.user?.phoneVerified || state.hasVerifiedPhone),
    contactsSynced: Boolean(state.onboarding?.contacts_synced),
    trustedContactsCount: state.onboarding?.trusted_contacts_count ?? 0,
    groupsCreatedCount: state.onboarding?.groups_created_count ?? 0,
    hasCompletedIntro: state.hasCompletedOnboarding,
    hasDevicePermissions: state.hasGrantedPermissions,
    apiOnboardingComplete: state.onboarding?.onboarding_complete,
    onboarding: state.onboarding,
  });
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isAuthenticated: false,
      hasCompletedOnboarding: false,
      hasVerifiedPhone: false,
      hasGrantedPermissions: false,
      onboarding: null,
      onboardingFlags: null,
      isLoading: true,
      setUser: (user) =>
        set((state) => {
          const next = {
            ...state,
            user,
            isAuthenticated: !!user,
            hasVerifiedPhone: Boolean(user?.phoneVerified),
          };
          return { ...next, onboardingFlags: deriveFlags(next) };
        }),
      setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
      setOnboarding: (onboarding) =>
        set((state) => {
          const next = {
            ...state,
            onboarding,
            hasVerifiedPhone: onboarding ? !onboarding.needs_phone_verification : state.hasVerifiedPhone,
          };
          return { ...next, onboardingFlags: deriveFlags(next) };
        }),
      setOnboardingFlags: (onboardingFlags) => set({ onboardingFlags }),
      completeOnboarding: () =>
        set((state) => {
          const next = { ...state, hasCompletedOnboarding: true };
          return { ...next, onboardingFlags: deriveFlags(next) };
        }),
      setPhoneVerified: (hasVerifiedPhone) =>
        set((state) => {
          const next = { ...state, hasVerifiedPhone };
          return { ...next, onboardingFlags: deriveFlags(next) };
        }),
      setPermissionsGranted: (hasGrantedPermissions) =>
        set((state) => {
          const next = { ...state, hasGrantedPermissions };
          return { ...next, onboardingFlags: deriveFlags(next) };
        }),
      setLoading: (isLoading) => set({ isLoading }),
      signOut: () =>
        set({
          user: null,
          isAuthenticated: false,
          hasCompletedOnboarding: false,
          hasVerifiedPhone: false,
          hasGrantedPermissions: false,
          onboarding: null,
          onboardingFlags: null,
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

export function getOnboardingFlagsSnapshot(): OnboardingFlags | null {
  const state = useAuthStore.getState();
  return state.onboardingFlags ?? deriveFlags(state);
}
