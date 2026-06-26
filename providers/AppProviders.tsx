import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { usePushTokenSync } from '@/hooks/usePushTokenSync';
import { useTripWatchRecovery } from '@/hooks/useTripWatchRecovery';
import { useSOSRecovery } from '@/hooks/useSOSRecovery';
import { initializeNotificationInfrastructure } from '@/services/notifications';
import { PERSISTED_QUERY_KEYS, queryClient } from '@/lib/queryClient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useEffect } from 'react';

const asyncStoragePersister = createAsyncStoragePersister({
  storage: AsyncStorage,
  key: 'street-angels-query-cache',
});

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

function NotificationBootstrap() {
  useEffect(() => {
    void initializeNotificationInfrastructure().catch((error) => {
      console.warn('[notifications] Early init failed:', error);
    });
  }, []);
  return null;
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{
            persister: asyncStoragePersister,
            maxAge: 1000 * 60 * 60 * 24,
            dehydrateOptions: {
              shouldDehydrateQuery: (query) =>
                PERSISTED_QUERY_KEYS.some(
                  (key) => JSON.stringify(key) === JSON.stringify(query.queryKey)
                ),
            },
          }}>
          <NotificationBootstrap />
          <NetworkListener />
          <PushTokenListener />
          <TripWatchRecoveryListener />
          <SOSRecoveryListener />
          {children}
        </PersistQueryClientProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
