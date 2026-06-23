import { AppLogo } from "@/components/ui/AppLogo";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Text } from "@/components/ui/Text";
import { GoogleSignInCancelledError, signInWithEmail, signInWithGoogle } from "@/services/auth";
import { formatGoogleSignInError, isGoogleSignInCancelled } from "@/lib/googleAuthErrors";
import { isGoogleSignInAvailable, usesDevGoogleSignIn } from "@/services/googleSignIn";
import { useAuthStore } from "@/stores/authStore";
import { zodResolver } from "@hookform/resolvers/zod";
import { type Href, router } from "expo-router";
import { useState } from "react";
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

export default function LegacyLoginScreen() {
  const insets = useSafeAreaInsets();
  const { setLoading, isLoading } = useAuthStore();
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

  const finishSignIn = async (signIn: () => Promise<unknown>) => {
    setError(null);
    setLoading(true);
    try {
      await signIn();
      router.replace("/");
    } catch (err) {
      if (isGoogleSignInCancelled(err) || err instanceof GoogleSignInCancelledError) return;
      const message = formatGoogleSignInError(err);
      if (message) setError(message);
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
        Legacy sign-in
      </Text>
      <Text variant="body" muted className="mb-8">
        For existing accounts only. New users should sign in with a mobile number.
      </Text>

      <View className="gap-3">
        <Button
          title="Continue with Google"
          variant="secondary"
          size="lg"
          loading={isLoading}
          disabled={!googleAvailable}
          onPress={() => finishSignIn(signInWithGoogle)}
          icon={
            <Ionicons name="logo-google" size={22} color="#fff" style={{ marginRight: 8 }} />
          }
        />

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
              onPress={handleSubmit((data) => finishSignIn(() => signInWithEmail(data)))}
            />
          </View>
        )}

        <Pressable className="py-3" onPress={() => router.push("/(auth)/login" as Href)}>
          <Text variant="body" className="text-center text-responder-light">
            Back to phone sign-in
          </Text>
        </Pressable>
      </View>

      {error && (
        <Text variant="caption" className="mt-4 text-center text-emergency">
          {error}
        </Text>
      )}

      {(usesDevGoogleSignIn() || !googleAvailable) && (
        <Text variant="caption" muted className="mt-6 text-center">
          Google Sign-In requires an EAS dev or store build.
        </Text>
      )}
    </ScrollView>
  );
}
