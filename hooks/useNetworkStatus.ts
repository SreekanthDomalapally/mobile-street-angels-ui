import NetInfo from '@react-native-community/netinfo';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { flushPendingSOSQueue } from '@/services/sosQueue';
import { useSOSStore } from '@/stores/sosStore';

export function useNetworkStatus() {
  const setOffline = useSOSStore((s) => s.setOffline);
  const setActiveAlert = useSOSStore((s) => s.setActiveAlert);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !(state.isConnected && state.isInternetReachable !== false);
      setOffline(offline);

      if (!offline) {
        void flushPendingSOSQueue()
          .then((alert) => {
            if (!alert) return;
            const { activeAlert } = useSOSStore.getState();
            if (activeAlert) return;
            setActiveAlert(alert);
            router.replace('/sos/active');
          })
          .catch((error) => {
            console.warn('[network] Failed to flush SOS queue:', error);
          });
      }
    });

    return unsubscribe;
  }, [setOffline, setActiveAlert]);
}
