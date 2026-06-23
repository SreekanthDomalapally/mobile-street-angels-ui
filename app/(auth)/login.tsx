import { AppLogo } from '@/components/ui/AppLogo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import {
  buildE164FromParts,
  CountryCodePicker,
  DEFAULT_COUNTRIES,
  type CountryOption,
} from '@/components/auth/CountryCodePicker';
import { normalizePhoneE164 } from '@/services/phone';
import { usesBackendPhoneOtp } from '@/lib/devOtp';
import { startPhoneSignIn } from '@/services/firebasePhoneAuth';
import { useAuthStore } from '@/stores/authStore';
import { type Href, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function PhoneLoginScreen() {
  const insets = useSafeAreaInsets();
  const { setLoading, isLoading } = useAuthStore();
  const [country, setCountry] = useState<CountryOption>(DEFAULT_COUNTRIES[0]);
  const [localNumber, setLocalNumber] = useState('');
  const [error, setError] = useState<string | null>(null);

  const continueToOtp = async () => {
    const e164 = normalizePhoneE164(buildE164FromParts(country.dial, localNumber), country.code);
    if (!e164) {
      setError('Enter a valid mobile number for your country.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const session = await startPhoneSignIn(e164, country.code);
      const query = new URLSearchParams({
        phone: e164,
        countryCode: country.code,
        useBackendOtp: session.useBackendOtp ? '1' : '0',
        devOtp: session.devOtp ?? '',
      }).toString();
      router.push(`/(auth)/phone-otp?${query}` as Href);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-charcoal-950"
      contentContainerStyle={{
        paddingTop: insets.top + 40,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 32,
        flexGrow: 1,
      }}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
      showsVerticalScrollIndicator={false}>
      <View className="mb-6 items-center">
        <AppLogo size="lg" />
      </View>
      <Text variant="hero" className="mb-2">
        Your number
      </Text>
      <Text variant="body" muted className="mb-8">
        {usesBackendPhoneOtp()
          ? 'Sign in with your mobile number. In test mode, your code appears on the next screen (no text message yet).'
          : 'Sign in with your mobile number. We will text you a one-time code — like WhatsApp.'}
      </Text>

      <View className="gap-4">
        <CountryCodePicker value={country} onChange={setCountry} />
        <Input
          label="Mobile number"
          value={localNumber}
          onChangeText={setLocalNumber}
          keyboardType="phone-pad"
          placeholder="87 123 4567"
          accessibilityLabel="Mobile number"
        />
        <Button title="Continue" size="lg" loading={isLoading} onPress={continueToOtp} />
      </View>

      {error && (
        <Text variant="caption" className="mt-4 text-center text-emergency">
          {error}
        </Text>
      )}

      <Pressable className="mt-6 py-3" onPress={() => router.push('/(auth)/legacy-login' as Href)}>
        <Text variant="caption" muted className="text-center">
          Other sign-in options (email / Google)
        </Text>
      </Pressable>

      <Text variant="caption" muted className="mt-auto pt-8 text-center leading-relaxed">
        By continuing, you agree to our Terms and Privacy Policy. Your contacts are used only to
        find people you know on YouHoo Alert.
      </Text>
    </ScrollView>
  );
}
