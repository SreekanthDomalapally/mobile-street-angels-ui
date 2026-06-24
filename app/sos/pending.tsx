import { EmergencyDisclaimer } from '@/components/sos/EmergencyDisclaimer';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { flushPendingSOSQueue, getPendingSOSQueue } from '@/services/sosQueue';
import { useSOSStore } from '@/stores/sosStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PendingSOSScreen() {
  const insets = useSafeAreaInsets();
  const isOffline = useSOSStore((s) => s.isOffline);
  const setActiveAlert = useSOSStore((s) => s.setActiveAlert);
  const [pendingCount, setPendingCount] = useState(0);
  const [retrying, setRetrying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshCount = useCallback(async () => {
    const queue = await getPendingSOSQueue();
    setPendingCount(queue.length);
    if (queue.length === 0) {
      router.replace('/(tabs)');
    }
  }, []);

  useEffect(() => {
    void refreshCount();
  }, [refreshCount]);

  useNetworkStatus();

  const handleRetry = async () => {
    setRetrying(true);
    setError(null);
    try {
      const alert = await flushPendingSOSQueue();
      if (alert) {
        setActiveAlert(alert);
        router.replace('/sos/active');
        return;
      }
      await refreshCount();
      if (!isOffline) {
        setError('Nothing to send — the queue may have already been delivered.');
      } else {
        setError('Still offline. Your alert will send automatically when connection returns.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Retry failed. Try again in a moment.');
    } finally {
      setRetrying(false);
    }
  };

  return (
    <View className="flex-1 bg-charcoal-950">
      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom + 32,
        }}
      >
        <View className="mb-6 items-center">
          <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-warning/15">
            {retrying ? (
              <ActivityIndicator color="#c9a04a" size="large" />
            ) : (
              <Ionicons name="cloud-offline-outline" size={40} color="#c9a04a" />
            )}
          </View>
          <Text variant="title" className="mb-2 text-center">
            Alert pending
          </Text>
          <Text variant="body" muted className="text-center leading-relaxed">
            {pendingCount > 0
              ? `${pendingCount} SOS alert${pendingCount === 1 ? '' : 's'} queued. Will send automatically when you are back online.`
              : 'Checking queue…'}
          </Text>
        </View>

        <EmergencyDisclaimer className="mb-6" />

        {isOffline ? (
          <View className="mb-4 rounded-2xl border border-glass-border bg-charcoal-900 px-4 py-3">
            <Text variant="caption" muted className="text-center">
              No internet connection detected
            </Text>
          </View>
        ) : (
          <View className="mb-4 rounded-2xl border border-responder/30 bg-responder/10 px-4 py-3">
            <Text variant="caption" className="text-center text-responder-light">
              Connection restored — tap Retry now to send immediately
            </Text>
          </View>
        )}

        {error ? (
          <Text variant="caption" className="mb-4 text-center text-emergency">
            {error}
          </Text>
        ) : null}

        <View className="gap-3">
          <Button
            title="Retry now"
            variant="emergency"
            size="lg"
            loading={retrying}
            onPress={handleRetry}
          />
          <Button title="Back to home" variant="ghost" onPress={() => router.replace('/(tabs)')} />
        </View>
      </ScrollView>
    </View>
  );
}
