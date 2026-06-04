import { router } from 'expo-router';
import { useState } from 'react';
import { Platform, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { signInWithAppleMock, signInWithGoogleMock } from '@/services/firebase';
import { useAuthStore } from '@/stores/authStore';

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { setUser, setLoading, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async (provider: 'google' | 'apple') => {
    setError(null);
    setLoading(true);
    try {
      const user =
        provider === 'google' ? await signInWithGoogleMock() : await signInWithAppleMock();
      setUser(user);
      router.replace('/(auth)/permissions');
    } catch {
      setError('Sign in failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      className="flex-1 bg-charcoal-950 px-8"
      style={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }}>
      <Text variant="hero" className="mb-2">
        Welcome
      </Text>
      <Text variant="body" muted className="mb-12">
        Sign in to connect with your trusted circle. Your data stays private.
      </Text>

      <View className="gap-4">
        <Button
          title="Continue with Google"
          variant="secondary"
          size="lg"
          loading={isLoading}
          onPress={() => handleSignIn('google')}
          icon={
            <Ionicons
              name="logo-google"
              size={22}
              color="#fff"
              style={{ marginRight: 8 }}
            />
          }
        />
        {Platform.OS === 'ios' && (
          <Button
            title="Continue with Apple"
            variant="secondary"
            size="lg"
            disabled={isLoading}
            onPress={() => handleSignIn('apple')}
            icon={
              <Ionicons
                name="logo-apple"
                size={22}
                color="#fff"
                style={{ marginRight: 8 }}
              />
            }
          />
        )}
      </View>

      {error && (
        <Text variant="caption" className="mt-4 text-center text-emergency">
          {error}
        </Text>
      )}

      <Text variant="caption" muted className="mt-auto text-center leading-relaxed">
        By continuing, you agree to our Terms and Privacy Policy. We never sell your location data.
      </Text>
    </View>
  );
}
