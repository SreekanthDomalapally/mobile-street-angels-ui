import { AppLogo } from '@/components/ui/AppLogo';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { registerDeviceToken } from '@/services/api/auth';
import { getAccessToken } from '@/services/tokens';
import { requestContactsPermission } from '@/services/contacts';
import { requestLocationPermission } from '@/services/location';
import { registerForPushNotifications } from '@/services/notifications';
import { useAuthStore } from '@/stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const steps = [
  {
    id: 'location',
    icon: 'location-outline' as const,
    title: 'Location',
    description:
      'Share your live position only during an active alert — never in the background without cause.',
  },
  {
    id: 'contacts',
    icon: 'people-outline' as const,
    title: 'Contacts',
    description:
      'Pick trusted people from your phone to add to your circle, or send them an invite to join YouHoo Alert.',
  },
  {
    id: 'notifications',
    icon: 'notifications-outline' as const,
    title: 'Notifications',
    description:
      'Critical alerts from trusted responders, even on your lock screen.',
  },
] as const;

export default function PermissionsScreen() {
  const insets = useSafeAreaInsets();
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const setPermissionsGranted = useAuthStore((s) => s.setPermissionsGranted);

  const current = steps[stepIndex];

  const finishOrAdvance = () => {
    if (stepIndex < steps.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      setPermissionsGranted(true);
      router.replace('/(tabs)');
    }
  };

  const requestCurrent = async () => {
    setLoading(true);
    try {
      if (current.id === 'location') {
        await requestLocationPermission();
      } else if (current.id === 'contacts') {
        await requestContactsPermission();
      } else {
        const pushToken = await registerForPushNotifications();
        if (pushToken) {
          const accessToken = await getAccessToken();
          if (accessToken) {
            await registerDeviceToken(accessToken, pushToken, Platform.OS);
          }
        }
      }
    } catch (error) {
      console.warn('[permissions] Request failed:', error);
    } finally {
      setLoading(false);
      finishOrAdvance();
    }
  };

  const skip = () => {
    finishOrAdvance();
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
      <Text variant="body" muted className="mb-12 leading-relaxed">
        {current.description}
      </Text>

      <View className="mt-auto gap-3">
        <Button
          title="Allow access"
          size="lg"
          loading={loading}
          onPress={requestCurrent}
        />
        <Button title="Not now" variant="ghost" onPress={skip} disabled={loading} />
      </View>
    </View>
  );
}
