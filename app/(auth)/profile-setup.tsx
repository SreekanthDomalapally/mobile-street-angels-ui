import { AppLogo } from '@/components/ui/AppLogo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { GroupInvitesSection } from '@/components/groups/GroupInvitesSection';
import { authenticatedRequest } from '@/services/api/client';
import { navigateAfterOnboardingStep } from '@/services/onboardingState';
import { useAuthStore } from '@/stores/authStore';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileSetupScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [displayName, setDisplayName] = useState(
    user?.displayName?.startsWith('User ') ? '' : user?.displayName ?? ''
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveProfile = async () => {
    const trimmed = displayName.trim();
    if (trimmed.length < 2) {
      setError('Enter the name your contacts will recognize.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const updated = await authenticatedRequest<{ full_name: string }>('/users/me', {
        method: 'PATCH',
        body: JSON.stringify({ full_name: trimmed }),
      });
      if (user) {
        setUser({ ...user, displayName: updated.full_name });
      }
      await navigateAfterOnboardingStep();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save profile.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-charcoal-950"
      contentContainerStyle={{
        paddingTop: insets.top + 32,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 32,
        flexGrow: 1,
      }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets>
      <View className="mb-6 items-center">
        <AppLogo size="md" />
      </View>
      <Text variant="hero" className="mb-2">
        Your name
      </Text>
      <Text variant="body" muted className="mb-8">
        This is how friends and family will see you in alerts and groups.
      </Text>

      <Input
        label="Display name"
        value={displayName}
        onChangeText={setDisplayName}
        autoCapitalize="words"
        placeholder="Alex Rivera"
        accessibilityLabel="Display name"
      />

      <GroupInvitesSection />

      <Button title="Continue" size="lg" className="mt-6" loading={loading} onPress={saveProfile} />

      {error && (
        <Text variant="caption" className="mt-4 text-center text-emergency">
          {error}
        </Text>
      )}
    </ScrollView>
  );
}
