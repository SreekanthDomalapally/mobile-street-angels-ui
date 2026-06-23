import { AppLogo } from '@/components/ui/AppLogo';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { APP_CAPTION } from '@/constants/branding';
import { colors } from '@/constants/theme';
import { useAuthStore } from '@/stores/authStore';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const completeOnboarding = useAuthStore((s) => s.completeOnboarding);

  const continueFlow = () => {
    completeOnboarding();
    router.replace('/(auth)/login');
  };

  return (
    <View className="flex-1 bg-charcoal-950">
      <LinearGradient
        colors={[colors.surface, colors.background, colors.background]}
        style={{ flex: 1 }}>
        <ScrollView
          className="flex-1"
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: insets.top + 24,
            paddingHorizontal: 32,
            paddingBottom: 16,
            justifyContent: 'center',
          }}
          showsVerticalScrollIndicator={false}>
          <View className="items-center">
            <AppLogo size="md" />
          </View>
          <Text variant="hero" className="mb-4 mt-6 text-center leading-tight">
            {APP_CAPTION}
          </Text>
          <Text variant="body" muted className="mb-8 text-center leading-relaxed">
            A calm, trusted way to reach people who care — when seconds matter. Not social
            media. Real help, nearby.
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
        </ScrollView>

        <View
          className="border-t border-glass-border px-8 pt-4"
          style={{ paddingBottom: insets.bottom + 24 }}>
          <Button title="Get started" size="lg" onPress={continueFlow} />
          <Text variant="caption" muted className="mt-4 text-center">
            Free forever · Optional donations only
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
}
