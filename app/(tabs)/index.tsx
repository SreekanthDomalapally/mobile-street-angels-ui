import { NearbyResponders } from "@/components/home/NearbyResponders";
import { StatusIndicator } from "@/components/home/StatusIndicator";
import { CountdownOverlay } from "@/components/sos/CountdownOverlay";
import { EmergencyTypePicker } from "@/components/sos/EmergencyTypePicker";
import { SOSButton } from "@/components/sos/SOSButton";
import { AppLogo } from "@/components/ui/AppLogo";
import { Text } from "@/components/ui/Text";
import { useSettingsStore } from "@/stores/settingsStore";
import { useSOSStore } from "@/stores/sosStore";
import { router } from "expo-router";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const countdownSeconds = useSettingsStore(
    (s) => s.emergency.countdownSeconds,
  );
  const { status, countdown, setCountdown, activateSOS, cancelArming } =
    useSOSStore();

  const handleSOSComplete = () => {
    setCountdown(countdownSeconds);
  };

  const handleCountdownComplete = () => {
    activateSOS();
    router.push("/sos/active");
  };

  const handleCountdownCancel = () => {
    setCountdown(null);
    cancelArming();
  };

  return (
    <View className="flex-1 bg-charcoal-950">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6 flex-row items-center justify-between">
          <View className="flex-1 gap-2">
            <AppLogo size="sm" />
            <Text variant="title">You're protected</Text>
          </View>
          <StatusIndicator />
        </View>

        <View className="my-8 items-center">
          <SOSButton onActivate={handleSOSComplete} />
        </View>

        <EmergencyTypePicker />

        <View className="mt-10">
          <NearbyResponders />
        </View>
      </ScrollView>

      {countdown !== null && status !== "active" && (
        <CountdownOverlay
          seconds={countdown}
          onComplete={handleCountdownComplete}
          onCancel={handleCountdownCancel}
        />
      )}
    </View>
  );
}
