import { AppLogo } from "@/components/ui/AppLogo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { GoogleSignInCancelledError, signInWithEmail, signInWithGoogle } from "@/services/auth";
import { isGoogleSignInAvailable, usesDevGoogleSignIn } from "@/services/googleSignIn";
import { useAuthStore } from "@/stores/authStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Href, router } from "expo-router";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { z } from "zod";
import { Ionicons } from "@expo/vector-icons";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { setUser, setLoading, isLoading, isAuthenticated, hasGrantedPermissions } =
    useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const googleAvailable = isGoogleSignInAvailable();
  const [showEmailForm, setShowEmailForm] = useState(!googleAvailable);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  });

  useEffect(() => {
    if (isAuthenticated) {
      const phoneVerified = useAuthStore.getState().hasVerifiedPhone || useAuthStore.getState().user?.phoneVerified;
      if (!phoneVerified) {
        router.replace('/(auth)/verify-phone');
        return;
      }
      router.replace(hasGrantedPermissions ? '/(tabs)' : '/(auth)/permissions');
    }
  }, [isAuthenticated, hasGrantedPermissions]);

  const finishSignIn = (user: Awaited<ReturnType<typeof signInWithGoogle>>) => {
    setUser(user);
    router.replace("/(auth)/permissions");
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      finishSignIn(await signInWithGoogle());
    } catch (err) {
      if (err instanceof GoogleSignInCancelledError) return;
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSignIn = async (data: LoginForm) => {
    setError(null);
    setLoading(true);
    try {
      finishSignIn(await signInWithEmail(data));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed. Please try again.");
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
        Welcome
      </Text>
      <Text variant="body" muted className="mb-8">
        Sign in to connect with your trusted circle. Your data stays private.
      </Text>

      <View className="gap-3">
        <Button
          title="Continue with Google"
          variant="secondary"
          size="lg"
          loading={isLoading}
          disabled={!googleAvailable}
          onPress={handleGoogleSignIn}
          icon={
            <Ionicons name="logo-google" size={22} color="#fff" style={{ marginRight: 8 }} />
          }
        />
        {!googleAvailable && (
          <Text variant="caption" muted className="text-center">
            Google Sign-In needs your EAS store or dev build. In Expo Go, use email sign-in below.
          </Text>
        )}
        {usesDevGoogleSignIn() && (
          <Text variant="caption" muted className="text-center">
            Web dev mode: use email sign-in below.
          </Text>
        )}

        <Button
          title={showEmailForm ? "Hide email sign-in" : "Sign in with email"}
          variant="ghost"
          size="lg"
          onPress={() => setShowEmailForm((v) => !v)}
        />

        {showEmailForm && (
          <View className="mt-2">
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
              <Text variant="caption" className="-mt-2 mb-4 text-emergency">
                {errors.password.message}
              </Text>
            )}

            <Button
              title="Sign in"
              size="lg"
              loading={isLoading}
              onPress={handleSubmit(handleEmailSignIn)}
            />
          </View>
        )}

        <Pressable className="py-3" onPress={() => router.push("/(auth)/register" as Href)}>
          <Text variant="body" className="text-center text-responder-light">
            Create an account with email
          </Text>
        </Pressable>
      </View>

      {error && (
        <Text variant="caption" className="mt-4 text-center text-emergency">
          {error}
        </Text>
      )}

      <Text variant="caption" muted className="mt-auto pt-8 text-center leading-relaxed">
        By continuing, you agree to our Terms and Privacy Policy. We never sell your location
        data.
      </Text>
    </ScrollView>
  );
}
