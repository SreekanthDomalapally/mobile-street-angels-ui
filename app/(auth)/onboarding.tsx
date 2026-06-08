import { AppLogo } from "@/components/ui/AppLogo";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { APP_CAPTION } from "@/constants/branding";
import { colors } from "@/constants/theme";
import { useAuthStore } from "@/stores/authStore";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  const continueFlow = () => {
    completeOnboarding();
    router.replace("/(auth)/login");
  };

  return (
    <View className="flex-1 bg-charcoal-950">
      <LinearGradient
        colors={[colors.surface, colors.background, colors.background]}
        className="flex-1"
        style={{
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 24,
        }}
      >
        <View className="flex-1 justify-center px-8">
          <View className="mb-8">
            <AppLogo size="lg" />
          </View>
          <Text variant="hero" className="mb-4 leading-tight">
            {APP_CAPTION}
          </Text>
          <Text variant="body" muted className="mb-12 leading-relaxed">
            A calm, trusted way to reach people who care — when seconds matter.
            Not social media. Real help, nearby.
          </Text>
          <View className="gap-4">
            <View className="flex-row items-start gap-3">
              <Text className="text-responder">✓</Text>
              <Text variant="body" muted className="flex-1">
                Hold SOS for 2 seconds, then a 3-second countdown — tap Cancel to stop
              </Text>
            </View>
            <View className="flex-row items-start gap-3">
              <Text className="text-responder">✓</Text>
              <Text variant="body" muted className="flex-1">
                Live location shared only when you need it
              </Text>
            </View>
            <View className="flex-row items-start gap-3">
              <Text className="text-responder">✓</Text>
              <Text variant="body" muted className="flex-1">
                Trusted contacts — never strangers on a feed
              </Text>
            </View>
          </View>
        </View>
        <View className="px-8">
          <Button title="Get started" size="lg" onPress={continueFlow} />
          <Text variant="caption" muted className="mt-4 text-center">
            Free forever · Optional donations only
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}
