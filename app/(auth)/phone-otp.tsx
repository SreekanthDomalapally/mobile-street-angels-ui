import { AppLogo } from '@/components/ui/AppLogo';
import { Button } from '@/components/ui/Button';
import { OtpInput } from '@/components/auth/OtpInput';
import { Text } from '@/components/ui/Text';
import { confirmPhoneSignIn, resendPhoneSignIn, type PhoneSignInSession } from '@/services/firebasePhoneAuth';
import {
  getLastDevOtp,
  getLastPhoneSession,
  setLastPhoneSession,
} from '@/services/phoneAuthSession';
import { signInWithPhoneSession } from '@/services/auth';
import { formatPhoneForDisplay } from '@/services/phone';
import { testOtpHint, usesBackendPhoneOtp } from '@/lib/devOtp';
import { useAuthStore } from '@/stores/authStore';
import { type Href, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const RESEND_SECONDS = 30;

export default function OtpVerificationScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    phone?: string;
    countryCode?: string;
    useBackendOtp?: string;
  }>();
  const { setLoading, isLoading } = useAuthStore();
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [devHint, setDevHint] = useState<string | null>(() => testOtpHint(getLastDevOtp()));
  const [phoneSession, setPhoneSession] = useState<PhoneSignInSession | null>(() =>
    getLastPhoneSession(),
  );

  const session = useMemo<PhoneSignInSession | null>(() => {
    if (!params.phone || !params.countryCode) return null;

    const normalize = (value: string) => value.replace(/\D/g, '');
    const stored = phoneSession ?? getLastPhoneSession();
    if (stored && normalize(stored.phoneE164) === normalize(params.phone)) {
      return {
        ...stored,
        // Keep URL country if present; phone/confirmation come from memory.
        countryCode: params.countryCode || stored.countryCode,
      };
    }

    return {
      phoneE164: params.phone.startsWith('+') ? params.phone : `+${params.phone.replace(/\D/g, '')}`,
      countryCode: params.countryCode,
      useBackendOtp: params.useBackendOtp === '1',
    };
  }, [params.countryCode, params.phone, params.useBackendOtp, phoneSession]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setInterval(() => setSecondsLeft((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [secondsLeft]);

  const verifyOtp = async () => {
    if (!session) {
      setError('Missing phone session. Go back and try again.');
      return;
    }
    if (otp.length < 6) {
      setError('Enter the 6-digit code we sent you.');
      return;
    }

    setError(null);
    setLoading(true);
    try {
      const response = await confirmPhoneSignIn(session, otp);
      await signInWithPhoneSession(response);
      router.replace('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid verification code.');
    } finally {
      setLoading(false);
    }
  };

  const resendCode = async () => {
    if (!session || secondsLeft > 0) return;
    setError(null);
    setLoading(true);
    try {
      const next = await resendPhoneSignIn(session);
      setLastPhoneSession(next);
      setPhoneSession(next);
      setSecondsLeft(RESEND_SECONDS);
      const hint = testOtpHint(next.devOtp);
      if (hint) setDevHint(hint);
      else setDevHint(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not resend code.');
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <View className="flex-1 items-center justify-center bg-charcoal-950 px-8">
        <Text variant="body" className="mb-4 text-center text-white">
          Session expired. Enter your number again.
        </Text>
        <Button title="Back to sign in" onPress={() => router.replace('/(auth)/login' as Href)} />
      </View>
    );
  }

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
      automaticallyAdjustKeyboardInsets
      showsVerticalScrollIndicator={false}>
      <View className="mb-6 items-center">
        <AppLogo size="md" />
      </View>
      <Text variant="hero" className="mb-2">
        Enter code
      </Text>
      <Text variant="body" muted className="mb-8">
        {usesBackendPhoneOtp()
          ? `Enter the 6-digit test code for ${formatPhoneForDisplay(session.phoneE164, session.countryCode)}. SMS is not sent in test mode.`
          : `We sent a 6-digit code to ${formatPhoneForDisplay(session.phoneE164, session.countryCode)}.`}
      </Text>

      <OtpInput value={otp} onChange={setOtp} disabled={isLoading} />

      {devHint ? (
        <View className="mt-4 rounded-2xl border border-warning/40 bg-warning/10 px-4 py-3">
          <Text variant="body" className="text-center text-warning">
            {devHint}
          </Text>
        </View>
      ) : usesBackendPhoneOtp() ? (
        <View className="mt-4 rounded-2xl border border-emergency/40 bg-emergency/10 px-4 py-3">
          <Text variant="body" className="text-center text-emergency-glow">
            No test code from the server. For local dev, set DEV_OTP_ENABLED=true on Railway or use
            an EAS preview/production build with Firebase Phone enabled.
          </Text>
        </View>
      ) : null}

      <Button
        title="Verify"
        size="lg"
        className="mt-8"
        loading={isLoading}
        disabled={otp.length < 6}
        onPress={verifyOtp}
      />

      <View className="mt-6 items-center gap-3">
        {secondsLeft > 0 ? (
          <Text variant="caption" muted>
            Resend code in {secondsLeft}s
          </Text>
        ) : (
          <Pressable onPress={resendCode} accessibilityRole="button">
            <Text variant="body" className="text-responder-light">
              Resend code
            </Text>
          </Pressable>
        )}
        <Pressable onPress={() => router.back()} accessibilityRole="button">
          <Text variant="caption" muted>
            Change number
          </Text>
        </Pressable>
      </View>

      {error && (
        <Text variant="caption" className="mt-4 text-center text-emergency">
          {error}
        </Text>
      )}
    </ScrollView>
  );
}
