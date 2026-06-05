import { create } from 'zustand';
import type { EmergencyType, Responder, SOSAlert, TimelineEvent } from '@/types';

interface SOSState {
  status: 'idle' | 'arming' | 'active' | 'responding' | 'resolved' | 'cancelled';
  emergencyType: EmergencyType;
  holdProgress: number;
  countdown: number | null;
  activeAlert: SOSAlert | null;
  isOffline: boolean;
  isActivating: boolean;
  activationError: string | null;
  setEmergencyType: (type: EmergencyType) => void;
  setHoldProgress: (progress: number) => void;
  setCountdown: (count: number | null) => void;
  startArming: () => void;
  cancelArming: () => void;
  setActivating: (value: boolean) => void;
  setActivationError: (message: string | null) => void;
  setActiveAlert: (alert: SOSAlert) => void;
  cancelSOS: () => void;
  updateResponders: (responders: Responder[]) => void;
  addTimelineEvent: (event: TimelineEvent) => void;
  setOffline: (offline: boolean) => void;
  resolveAlert: () => void;
  resetSOS: () => void;
}

export const useSOSStore = create<SOSState>((set, get) => ({
  status: 'idle',
  emergencyType: 'safety',
  holdProgress: 0,
  countdown: null,
  activeAlert: null,
  isOffline: false,
  isActivating: false,
  activationError: null,
  setEmergencyType: (emergencyType) => set({ emergencyType }),
  setHoldProgress: (holdProgress) => set({ holdProgress }),
  setCountdown: (countdown) => set({ countdown }),
  startArming: () => set({ status: 'arming', holdProgress: 0, activationError: null }),
  cancelArming: () => set({ status: 'idle', holdProgress: 0, countdown: null }),
  setActivating: (isActivating) => set({ isActivating }),
  setActivationError: (activationError) => set({ activationError }),
  setActiveAlert: (alert) =>
    set({
      status: alert.status === 'responding' ? 'responding' : 'active',
      holdProgress: 1,
      countdown: null,
      activeAlert: alert,
      isActivating: false,
      activationError: null,
    }),
  cancelSOS: () =>
    set({
      status: 'cancelled',
      activeAlert: null,
      holdProgress: 0,
      countdown: null,
      isActivating: false,
    }),
  updateResponders: (responders) => {
    const alert = get().activeAlert;
    if (!alert) return;
    set({
      status: 'responding',
      activeAlert: { ...alert, status: 'responding', responders },
    });
  },
  addTimelineEvent: (event) => {
    const alert = get().activeAlert;
    if (!alert) return;
    set({ activeAlert: { ...alert, timeline: [event, ...alert.timeline] } });
  },
  setOffline: (isOffline) => set({ isOffline }),
  resolveAlert: () =>
    set({
      status: 'resolved',
      activeAlert: null,
      holdProgress: 0,
      countdown: null,
      isActivating: false,
    }),
  resetSOS: () =>
    set({
      status: 'idle',
      holdProgress: 0,
      countdown: null,
      activeAlert: null,
      isActivating: false,
      activationError: null,
    }),
}));
