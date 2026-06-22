import { AppLogo } from '@/components/ui/AppLogo';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useDeviceContactRows } from '@/hooks/useDeviceContactRows';
import { markContactsSynced } from '@/services/onboardingState';
import { requestContactsPermission } from '@/services/contacts';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ContactSyncScreen() {
  const insets = useSafeAreaInsets();
  const { rows, loading, permissionDenied, reload } = useDeviceContactRows(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onPlatform = rows.filter((row) => row.onPlatform);
  const offPlatform = rows.filter((row) => !row.onPlatform);

  const handleSync = async () => {
    setSyncing(true);
    setError(null);
    try {
      const granted = await requestContactsPermission();
      if (!granted) {
        setError('Contacts permission is required to find people you trust.');
        return;
      }
      await reload();
      await markContactsSynced();
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not sync contacts.');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-charcoal-950"
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 24,
      }}>
      <View className="mb-6 items-center">
        <AppLogo size="md" />
      </View>

      <Text variant="hero" className="mb-2">
        Find trusted people
      </Text>
      <Text variant="body" muted className="mb-6">
        We only use your contacts to find people you already know on YouHoo Alert. Your contact
        list is never posted publicly.
      </Text>

      {loading ? (
        <View className="items-center py-8">
          <ActivityIndicator color="#6bb892" />
        </View>
      ) : (
        <View className="mb-6 gap-4">
          <View className="rounded-2xl border border-responder/30 bg-responder/10 p-4">
            <Text variant="label" className="mb-1 text-responder-light">
              Already on YouHoo Alert
            </Text>
            <Text variant="hero" className="text-responder-light">
              {onPlatform.length}
            </Text>
          </View>
          <View className="rounded-2xl border border-glass-border bg-charcoal-900 p-4">
            <Text variant="label" muted className="mb-1">
              Not yet on YouHoo Alert
            </Text>
            <Text variant="hero">{offPlatform.length}</Text>
          </View>
        </View>
      )}

      {permissionDenied && (
        <Text variant="caption" className="mb-4 text-warning">
          Allow contacts access in Settings to continue.
        </Text>
      )}

      {error && (
        <Text variant="caption" className="mb-4 text-emergency">
          {error}
        </Text>
      )}

      <Button title="Sync contacts" loading={syncing} onPress={handleSync} />
    </ScrollView>
  );
}
