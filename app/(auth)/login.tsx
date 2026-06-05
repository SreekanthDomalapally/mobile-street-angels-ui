import { AppLogo } from "@/components/ui/AppLogo";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { GoogleSignInCancelledError, signInWithGoogle } from "@/services/auth";
import { isGoogleSignInAvailable } from "@/services/googleSignIn";
import { signInWithAppleMock } from "@/services/firebase";
import { useAuthStore } from "@/stores/authStore";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import { Platform, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { setUser, setLoading, isLoading } = useAuthStore();
  const [error, setError] = useState<string | null>(null);
  const googleAvailable = isGoogleSignInAvailable();

  const handleGoogleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await signInWithGoogle();
      setUser(user);
      router.replace("/(auth)/permissions");
    } catch (err) {
      if (err instanceof GoogleSignInCancelledError) return;
      setError(
        err instanceof Error ? err.message : "Sign in failed. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    setError(null);
    setLoading(true);
    try {
      const user = await signInWithAppleMock();
      setUser(user);
      router.replace("/(auth)/permissions");
    } catch {
      setError("Sign in failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      className="flex-1 bg-charcoal-950 px-8"
      style={{ paddingTop: insets.top + 48, paddingBottom: insets.bottom + 24 }}
    >
      <View className="mb-8 items-center">
        <AppLogo size="md" />
      </View>
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
          disabled={!googleAvailable}
          onPress={handleGoogleSignIn}
          icon={
            <Ionicons
              name="logo-google"
              size={22}
              color="#fff"
              style={{ marginRight: 8 }}
            />
          }
        />
        {!googleAvailable && (
          <Text variant="caption" muted className="text-center">
            Google Sign-In requires an Android or iOS build (not Expo Go or web).
          </Text>
        )}
        {Platform.OS === "ios" && (
          <Button
            title="Continue with Apple"
            variant="secondary"
            size="lg"
            disabled={isLoading}
            onPress={handleAppleSignIn}
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

      <Text
        variant="caption"
        muted
        className="mt-auto text-center leading-relaxed"
      >
        By continuing, you agree to our Terms and Privacy Policy. We never sell
        your location data.
      </Text>
    </View>
  );
}
