import { AppLogo } from '@/components/ui/AppLogo';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Text } from '@/components/ui/Text';
import { registerAndSignIn } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { z } from 'zod';

const schema = z
  .object({
    fullName: z.string().min(2, 'Enter your full name'),
    email: z.string().email('Enter a valid email'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type RegisterForm = z.infer<typeof schema>;

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  const isLoading = useAuthStore((s) => s.isLoading);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setError(null);
    setLoading(true);
    try {
      const user = await registerAndSignIn({
        fullName: data.fullName,
        email: data.email,
        password: data.password,
      });
      setUser(user);
      router.replace('/(auth)/permissions');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-charcoal-950"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 32,
          paddingBottom: insets.bottom + 40,
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
          Create account
        </Text>
        <Text variant="body" muted className="mb-8">
          Join your trusted circle with email or Google on the next screen.
        </Text>

        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Full name"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              autoCapitalize="words"
              accessibilityLabel="Full name"
            />
          )}
        />
        {errors.fullName?.message && (
          <Text variant="caption" className="-mt-2 mb-2 text-emergency">
            {errors.fullName.message}
          </Text>
        )}

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Email"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              keyboardType="email-address"
              autoCapitalize="none"
              accessibilityLabel="Email"
            />
          )}
        />
        {errors.email?.message && (
          <Text variant="caption" className="-mt-2 mb-2 text-emergency">
            {errors.email.message}
          </Text>
        )}

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              accessibilityLabel="Password"
            />
          )}
        />
        {errors.password?.message && (
          <Text variant="caption" className="-mt-2 mb-2 text-emergency">
            {errors.password.message}
          </Text>
        )}

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Confirm password"
              value={value}
              onChangeText={onChange}
              onBlur={onBlur}
              secureTextEntry
              accessibilityLabel="Confirm password"
            />
          )}
        />
        {errors.confirmPassword?.message && (
          <Text variant="caption" className="-mt-2 mb-4 text-emergency">
            {errors.confirmPassword.message}
          </Text>
        )}

        <Button title="Create account" size="lg" loading={isLoading} onPress={handleSubmit(onSubmit)} />

        {error && (
          <Text variant="caption" className="mt-4 text-center text-emergency">
            {error}
          </Text>
        )}

        <Pressable className="mt-6 py-2" onPress={() => router.back()}>
          <Text variant="body" className="text-center text-responder-light">
            Already have an account? Sign in
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
