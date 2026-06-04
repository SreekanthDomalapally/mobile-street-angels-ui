import { create } from 'zustand';
import type { EmergencyType, Responder, SOSAlert, TimelineEvent } from '@/types';
import { mockActiveAlert, mockTimeline } from '@/data/mock';

interface SOSState {
  status: 'idle' | 'arming' | 'active' | 'responding' | 'resolved' | 'cancelled';
  emergencyType: EmergencyType;
  holdProgress: number;
  countdown: number | null;
  activeAlert: SOSAlert | null;
  isOffline: boolean;
  setEmergencyType: (type: EmergencyType) => void;
  setHoldProgress: (progress: number) => void;
  setCountdown: (count: number | null) => void;
  startArming: () => void;
  cancelArming: () => void;
  activateSOS: () => void;
  cancelSOS: () => void;
  updateResponders: (responders: Responder[]) => void;
  addTimelineEvent: (event: TimelineEvent) => void;
  setOffline: (offline: boolean) => void;
  resolveAlert: () => void;
}

export const useSOSStore = create<SOSState>((set, get) => ({
  status: 'idle',
  emergencyType: 'safety',
  holdProgress: 0,
  countdown: null,
  activeAlert: null,
  isOffline: false,
  setEmergencyType: (emergencyType) => set({ emergencyType }),
  setHoldProgress: (holdProgress) => set({ holdProgress }),
  setCountdown: (countdown) => set({ countdown }),
  startArming: () => set({ status: 'arming', holdProgress: 0 }),
  cancelArming: () => set({ status: 'idle', holdProgress: 0, countdown: null }),
  activateSOS: () => {
    const { emergencyType } = get();
    set({
      status: 'active',
      holdProgress: 1,
      countdown: null,
      activeAlert: {
        ...mockActiveAlert,
        id: `alert-${Date.now()}`,
        type: emergencyType,
        status: 'active',
        createdAt: new Date().toISOString(),
        timeline: [
          {
            id: `t-${Date.now()}`,
            timestamp: new Date().toISOString(),
            title: 'SOS alert sent',
            description: 'Your trusted contacts have been notified',
            type: 'system',
          },
          ...mockTimeline.slice(1),
        ],
      },
    });
    setTimeout(() => {
      const current = get();
      if (current.status === 'active') {
        set({ status: 'responding', activeAlert: { ...mockActiveAlert, type: emergencyType } });
      }
    }, 1500);
  },
  cancelSOS: () =>
    set({
      status: 'cancelled',
      activeAlert: null,
      holdProgress: 0,
      countdown: null,
    }),
  updateResponders: (responders) => {
    const alert = get().activeAlert;
    if (alert) set({ activeAlert: { ...alert, responders } });
  },
  addTimelineEvent: (event) => {
    const alert = get().activeAlert;
    if (alert) set({ activeAlert: { ...alert, timeline: [event, ...alert.timeline] } });
  },
  setOffline: (isOffline) => set({ isOffline }),
  resolveAlert: () => set({ status: 'resolved', activeAlert: null, holdProgress: 0 }),
}));
