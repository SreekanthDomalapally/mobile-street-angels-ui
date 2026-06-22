import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { usePushTokenSync } from '@/hooks/usePushTokenSync';
import { useTripWatchRecovery } from '@/hooks/useTripWatchRecovery';
import { useSOSRecovery } from '@/hooks/useSOSRecovery';
import { queryClient } from '@/lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

function NetworkListener() {
  useNetworkStatus();
  return null;
}

function PushTokenListener() {
  usePushTokenSync();
  return null;
}

function TripWatchRecoveryListener() {
  useTripWatchRecovery();
  return null;
}

function SOSRecoveryListener() {
  useSOSRecovery();
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <QueryClientProvider client={queryClient}>
          <NetworkListener />
          <PushTokenListener />
          <TripWatchRecoveryListener />
          <SOSRecoveryListener />
          {children}
        </QueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
