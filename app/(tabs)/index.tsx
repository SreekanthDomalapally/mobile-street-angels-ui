import { NearbyResponders } from "@/components/home/NearbyResponders";
import { StatusIndicator } from "@/components/home/StatusIndicator";
import { CountdownOverlay } from "@/components/sos/CountdownOverlay";
import { EmergencyTypePicker } from "@/components/sos/EmergencyTypePicker";
import { SOSButton } from "@/components/sos/SOSButton";
import { AppLogo } from "@/components/ui/AppLogo";
import { Text } from "@/components/ui/Text";
import { ApiError } from "@/services/api/client";
import { triggerSOS } from "@/services/sos";
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
  const {
    status,
    countdown,
    emergencyType,
    activationError,
    isActivating,
    setCountdown,
    setActiveAlert,
    setActivating,
    setActivationError,
    cancelArming,
  } = useSOSStore();

  const handleSOSComplete = () => {
    setActivationError(null);
    setCountdown(countdownSeconds);
  };

  const handleCountdownComplete = async () => {
    setActivating(true);
    setActivationError(null);
    try {
      const alert = await triggerSOS(emergencyType);
      setActiveAlert(alert);
      router.push("/sos/active");
    } catch (error) {
      setActivating(false);
      setCountdown(null);
      cancelArming();
      setActivationError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "SOS failed. Please try again."
      );
    }
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
        <View className="mb-6 gap-3">
          <View className="flex-row items-start justify-between gap-3">
            <AppLogo size="sm" />
            <View className="shrink-0">
              <StatusIndicator />
            </View>
          </View>
          <Text variant="title" className="leading-tight">
            You are protected
          </Text>
        </View>

        <View className="my-8 items-center">
          <SOSButton onActivate={handleSOSComplete} />
        </View>

        {activationError && (
          <Text variant="caption" className="mb-4 text-center text-emergency">
            {activationError}
          </Text>
        )}

        <EmergencyTypePicker />

        <View className="mt-10">
          <NearbyResponders />
        </View>
      </ScrollView>

      {countdown !== null && status !== "active" && (
        <CountdownOverlay
          seconds={countdown}
          loading={isActivating}
          onComplete={handleCountdownComplete}
          onCancel={handleCountdownCancel}
        />
      )}
    </View>
  );
}
