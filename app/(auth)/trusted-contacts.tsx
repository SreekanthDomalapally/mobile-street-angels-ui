import { AppLogo } from '@/components/ui/AppLogo';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useDeviceContactRows, type DeviceContactRow } from '@/hooks/useDeviceContactRows';
import { sendTrustedContactRequest } from '@/services/api/trustedContacts';
import { markTrustedMinimumMet } from '@/services/onboardingState';
import { ApiError } from '@/services/api/client';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

function TrustedContactRow({
  row,
  busy,
  onRequest,
}: {
  row: DeviceContactRow;
  busy: boolean;
  onRequest: () => void;
}) {
  return (
    <View className="mb-3 rounded-2xl border border-glass-border bg-charcoal-900 p-4">
      <Text variant="body">{row.name}</Text>
      <Text variant="caption" muted className="mt-1">
        {row.inviteEmail ?? row.primaryEmail ?? row.phoneNumbers[0] ?? 'No contact details'}
      </Text>
      <Button
        title="Send trusted contact request"
        size="sm"
        className="mt-3"
        loading={busy}
        disabled={!row.userId}
        onPress={onRequest}
      />
    </View>
  );
}

export default function TrustedContactsScreen() {
  const insets = useSafeAreaInsets();
  const { rows, loading } = useDeviceContactRows(true);
  const onPlatform = rows.filter((row) => row.onPlatform && row.userId);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [sentCount, setSentCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [continuing, setContinuing] = useState(false);

  const handleRequest = async (row: DeviceContactRow) => {
    if (!row.userId) return;
    setBusyId(row.id);
    setError(null);
    try {
      await sendTrustedContactRequest(row.userId, row.name);
      setSentCount((count) => count + 1);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send request.');
    } finally {
      setBusyId(null);
    }
  };

  const handleContinue = async () => {
    if (sentCount < 1 && onPlatform.length > 0) {
      setError('Send at least one trusted contact request to continue.');
      return;
    }

    setContinuing(true);
    try {
      await markTrustedMinimumMet();
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not continue.');
    } finally {
      setContinuing(false);
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
        Add trusted contacts
      </Text>
      <Text variant="body" muted className="mb-6">
        Trusted contacts can receive your SOS alerts and respond when you need help. They must
        accept your request before the connection is active.
      </Text>

      {loading ? (
        <ActivityIndicator color="#6bb892" className="my-8" />
      ) : onPlatform.length === 0 ? (
        <View className="mb-6 rounded-2xl border border-glass-border bg-charcoal-900 p-4">
          <Text variant="body" muted>
            No matches yet. You can invite people from the Groups tab after setup, or continue if
            you already invited someone by phone.
          </Text>
        </View>
      ) : (
        onPlatform.map((row) => (
          <TrustedContactRow
            key={row.id}
            row={row}
            busy={busyId === row.id}
            onRequest={() => handleRequest(row)}
          />
        ))
      )}

      {error && (
        <Text variant="caption" className="mb-4 text-emergency">
          {error}
        </Text>
      )}

      <Button
        title={sentCount > 0 ? 'Continue' : 'Continue without requests'}
        loading={continuing}
        onPress={handleContinue}
      />
      {sentCount > 0 && (
        <Text variant="caption" muted className="mt-3 text-center">
          {sentCount} request{sentCount === 1 ? '' : 's'} sent — pending acceptance.
        </Text>
      )}
    </ScrollView>
  );
}
