import { AppLogo } from '@/components/ui/AppLogo';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { markOnboardingComplete } from '@/services/onboardingState';
import { requestLocationPermission, requestBackgroundLocationPermission } from '@/services/location';
import { ensureNotificationPermission } from '@/services/notifications';
import { syncPushTokenWithServer } from '@/services/pushRegistration';
import { useAuthStore } from '@/stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const steps = [
  {
    id: 'location',
    icon: 'location-outline' as const,
    title: 'Location for emergencies',
    description:
      'Location is shared only during an active SOS alert so trusted contacts can find you.',
    required: true,
  },
  {
    id: 'notifications',
    icon: 'notifications-outline' as const,
    title: 'Critical notifications',
    description:
      'Allow lock-screen alerts when someone in your trusted circle needs help.',
    required: true,
  },
] as const;

export default function PermissionsScreen() {
  const insets = useSafeAreaInsets();
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const setPermissionsGranted = useAuthStore((s) => s.setPermissionsGranted);

  const current = steps[stepIndex];

  const finishOrAdvance = async () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
      return;
    }

    setPermissionsGranted(true);
    await markOnboardingComplete();
    router.replace('/');
  };

  const requestCurrent = async () => {
    setLoading(true);
    setError(null);
    try {
      if (current.id === 'location') {
        const granted = await requestLocationPermission();
        if (!granted) {
          setError('Location is required for emergency alerts.');
          return;
        }
        await requestBackgroundLocationPermission();
      } else {
        const granted = await ensureNotificationPermission();
        if (!granted) {
          setError('Notifications are required so you can receive SOS alerts.');
          return;
        }
        // Token may fail on emulators without Google Play / FCM — permission is enough to continue.
        await syncPushTokenWithServer().catch((err) => {
          console.warn('[permissions] Push token sync deferred:', err);
        });
      }
      await finishOrAdvance();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Permission setup failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      className="flex-1 bg-charcoal-950 px-8"
      style={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }}>
      <View className="mb-6">
        <AppLogo size="sm" />
      </View>
      <Text variant="label" className="mb-2">
        Step {stepIndex + 1} of {steps.length}
      </Text>
      <View className="mb-8 h-16 w-16 items-center justify-center rounded-2xl bg-charcoal-800">
        <Ionicons name={current.icon} size={32} color="#6bb892" />
      </View>
      <Text variant="title" className="mb-4">
        {current.title}
      </Text>
      <Text variant="body" muted className="mb-8 leading-relaxed">
        {current.description}
      </Text>

      {error && (
        <Text variant="caption" className="mb-4 text-emergency">
          {error}
        </Text>
      )}

      <View className="mt-auto gap-3">
        <Button title="Allow access" size="lg" loading={loading} onPress={requestCurrent} />
      </View>
    </View>
  );
}
