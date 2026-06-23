import { AppLogo } from '@/components/ui/AppLogo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { startPhoneVerification, verifyPhoneOtp } from '@/services/api/auth';
import { testOtpHint } from '@/lib/devOtp';
import { refreshOnboardingFlags } from '@/services/onboardingState';
import { ApiError } from '@/services/api/client';
import { normalizePhoneE164 } from '@/services/phone';
import { getAccessToken } from '@/services/tokens';
import { useAuthStore } from '@/stores/authStore';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function VerifyPhoneScreen() {
  const insets = useSafeAreaInsets();
  const setUser = useAuthStore((s) => s.setUser);
  const setPhoneVerified = useAuthStore((s) => s.setPhoneVerified);
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [devHint, setDevHint] = useState<string | null>(null);

  const sendCode = async () => {
    const normalized = normalizePhoneE164(phone);
    if (!normalized) {
      setError('Enter a valid mobile number including country code, e.g. +353…');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Please sign in again.');
      const response = await startPhoneVerification(token, normalized);
      const hint = testOtpHint(response.dev_otp);
      if (hint) setDevHint(hint);
      setStep('otp');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not send verification code.');
    } finally {
      setLoading(false);
    }
  };

  const confirmCode = async () => {
    const normalized = normalizePhoneE164(phone);
    if (!normalized || otp.trim().length < 4) {
      setError('Enter the verification code we sent to your phone.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const token = await getAccessToken();
      if (!token) throw new Error('Please sign in again.');
      const user = await verifyPhoneOtp(token, normalized, otp.trim());
      setUser(user);
      setPhoneVerified(true);
      await refreshOnboardingFlags();
      router.replace('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Invalid verification code.');
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
      keyboardShouldPersistTaps="handled">
      <View className="mb-8 items-center">
        <AppLogo size="md" />
      </View>

      <Text variant="hero" className="mb-2">
        Verify your mobile
      </Text>
      <Text variant="body" muted className="mb-8">
        Verify your mobile number so your trusted contacts can recognize and connect with you.
      </Text>

      {step === 'phone' ? (
        <>
          <Input
            label="Mobile number"
            placeholder="+353 87 123 4567"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoComplete="tel"
          />
          {error && (
            <Text variant="caption" className="mb-4 text-emergency">
              {error}
            </Text>
          )}
          <Button title="Send code" loading={loading} onPress={sendCode} />
        </>
      ) : (
        <>
          <Text variant="caption" muted className="mb-4">
            Enter the 6-digit code sent to {phone}
          </Text>
          {devHint && (
            <Text variant="caption" className="mb-3 text-warning">
              {devHint}
            </Text>
          )}
          <Input
            label="Verification code"
            placeholder="123456"
            value={otp}
            onChangeText={setOtp}
            keyboardType="number-pad"
            maxLength={6}
          />
          {error && (
            <Text variant="caption" className="mb-4 text-emergency">
              {error}
            </Text>
          )}
          <Button title="Verify" loading={loading} onPress={confirmCode} />
          <Button
            title="Change number"
            variant="ghost"
            className="mt-3"
            onPress={() => {
              setStep('phone');
              setOtp('');
              setError(null);
            }}
          />
        </>
      )}
    </ScrollView>
  );
}
