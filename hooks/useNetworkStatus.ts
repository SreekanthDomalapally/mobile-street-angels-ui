import NetInfo from '@react-native-community/netinfo';
import { useEffect } from 'react';
import { flushPendingSOSQueue } from '@/services/sosQueue';
import { useSOSStore } from '@/stores/sosStore';

export function useNetworkStatus() {
  const setOffline = useSOSStore((s) => s.setOffline);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state) => {
      const offline = !(state.isConnected && state.isInternetReachable !== false);
      setOffline(offline);

      if (!offline) {
        void flushPendingSOSQueue().catch((error) => {
          console.warn('[network] Failed to flush SOS queue:', error);
        });
      }
    });

    return unsubscribe;
  }, [setOffline]);
}
