import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import type { EmergencySettings, NotificationPreferences } from '@/types';
import { sosConfig } from '@/constants/theme';

interface SettingsState {
  notifications: NotificationPreferences;
  emergency: EmergencySettings;
  updateNotifications: (prefs: Partial<NotificationPreferences>) => void;
  updateEmergency: (settings: Partial<EmergencySettings>) => void;
}

const defaultNotifications: NotificationPreferences = {
  emergencyAlerts: true,
  groupUpdates: true,
  responderUpdates: true,
  marketing: false,
};

const defaultEmergency: EmergencySettings = {
  holdDurationMs: sosConfig.holdDurationMs,
  countdownSeconds: sosConfig.countdownSeconds,
  shareLocationByDefault: true,
  silentMode: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      notifications: defaultNotifications,
      emergency: defaultEmergency,
      updateNotifications: (prefs) =>
        set((state) => ({
          notifications: { ...state.notifications, ...prefs },
        })),
      updateEmergency: (settings) =>
        set((state) => ({
          emergency: { ...state.emergency, ...settings },
        })),
    }),
    {
      name: 'street-angels-settings',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
