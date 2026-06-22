import { clearPersistedActiveAlert, persistActiveAlertId } from '@/services/sosSession';
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

const idleState = {
  status: 'idle' as const,
  holdProgress: 0,
  countdown: null,
  activeAlert: null,
  isActivating: false,
  activationError: null,
};

function clearSession() {
  void clearPersistedActiveAlert();
}

export const useSOSStore = create<SOSState>((set, get) => ({
  ...idleState,
  emergencyType: 'safety',
  isOffline: false,
  setEmergencyType: (emergencyType) => set({ emergencyType }),
  setHoldProgress: (holdProgress) => set({ holdProgress }),
  setCountdown: (countdown) => set({ countdown }),
  startArming: () => set({ status: 'arming', holdProgress: 0, activationError: null }),
  cancelArming: () => set({ status: 'idle', holdProgress: 0, countdown: null }),
  setActivating: (isActivating) => set({ isActivating }),
  setActivationError: (activationError) => set({ activationError }),
  setActiveAlert: (alert) => {
    void persistActiveAlertId(alert.id);
    set({
      status: alert.status === 'responding' ? 'responding' : 'active',
      holdProgress: 1,
      countdown: null,
      activeAlert: alert,
      isActivating: false,
      activationError: null,
    });
  },
  cancelSOS: () => {
    clearSession();
    set(idleState);
  },
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
  resolveAlert: () => {
    clearSession();
    set(idleState);
  },
  resetSOS: () => {
    clearSession();
    set(idleState);
  },
}));

/** True when an SOS is in progress and the home screen should not arm a new alert. */
export function isSOSLive(): boolean {
  const { activeAlert, status } = useSOSStore.getState();
  return Boolean(
    activeAlert && (status === 'active' || status === 'responding' || status === 'arming')
  );
}
