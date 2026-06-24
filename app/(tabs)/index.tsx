import { TripWatchBanner } from "@/components/home/TripWatchBanner";
import { NearbyResponders } from "@/components/home/NearbyResponders";
import { ReadinessBanner } from "@/components/home/ReadinessBanner";
import { StatusIndicator } from "@/components/home/StatusIndicator";
import { CountdownOverlay } from "@/components/sos/CountdownOverlay";
import { EmergencyDisclaimer } from "@/components/sos/EmergencyDisclaimer";
import { EmergencyTypePicker } from "@/components/sos/EmergencyTypePicker";
import { SOSButton } from "@/components/sos/SOSButton";
import { AppLogo } from "@/components/ui/AppLogo";
import { Text } from "@/components/ui/Text";
import { useGroups } from "@/hooks/useGroups";
import { useSOSReadiness } from "@/hooks/useSOSReadiness";
import { markPerf } from "@/lib/perf";
import { ApiError } from "@/services/api/client";
import { getSOSLocation } from "@/services/location";
import { triggerSOS } from "@/services/sos";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { isSOSLive, useSOSStore } from "@/stores/sosStore";
import { useFocusEffect, router, type Href } from "expo-router";
import { useCallback, useEffect } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { readiness } = useSOSReadiness();
  const { data: groups } = useGroups();
  const countdownSeconds = useSettingsStore(
    (s) => s.emergency.countdownSeconds,
  );
  const emergencyType = useSOSStore((s) => s.emergencyType);
  const status = useSOSStore((s) => s.status);
  const countdown = useSOSStore((s) => s.countdown);
  const activationError = useSOSStore((s) => s.activationError);
  const isActivating = useSOSStore((s) => s.isActivating);
  const activeAlert = useSOSStore((s) => s.activeAlert);
  const setCountdown = useSOSStore((s) => s.setCountdown);
  const setActiveAlert = useSOSStore((s) => s.setActiveAlert);
  const setActivating = useSOSStore((s) => s.setActivating);
  const setActivationError = useSOSStore((s) => s.setActivationError);
  const cancelArming = useSOSStore((s) => s.cancelArming);
  const resetSOS = useSOSStore((s) => s.resetSOS);

  const sosInProgress =
    Boolean(activeAlert) && (status === "active" || status === "responding");

  const sosEnabled = readiness.ready && !sosInProgress;

  useEffect(() => {
    if (readiness.ready) {
      markPerf("home_ready");
    }
  }, [readiness.ready]);

  useFocusEffect(
    useCallback(() => {
      const state = useSOSStore.getState();

      if (
        state.activeAlert &&
        (state.status === "active" || state.status === "responding")
      ) {
        router.replace("/sos/active");
        return;
      }

      if (
        !state.activeAlert &&
        (state.countdown !== null ||
          state.status === "arming" ||
          state.isActivating)
      ) {
        resetSOS();
      }
    }, [resetSOS]),
  );

  const handleSOSComplete = () => {
    if (!sosEnabled || isSOSLive()) return;
    markPerf("sos_press");
    setActivationError(null);
    setCountdown(countdownSeconds);
  };

  const handleCountdownComplete = async () => {
    if (!readiness.ready) {
      setActivationError(readiness.reason ?? "Complete setup before sending SOS.");
      setCountdown(null);
      cancelArming();
      return;
    }

    if (isSOSLive()) {
      router.replace("/sos/active");
      return;
    }

    const groupsList = groups ?? [];
    if (!groupsList.length) {
      setActivationError("Create a trusted group before sending an SOS alert.");
      setCountdown(null);
      cancelArming();
      return;
    }

    setActivating(true);
    setActivationError(null);

    const location = await getSOSLocation();
    if (!location) {
      setActivating(false);
      setCountdown(null);
      cancelArming();
      setActivationError("Location access is required to send an SOS alert.");
      return;
    }

    const userId = useAuthStore.getState().user?.id ?? "";
    setActiveAlert({
      id: "pending",
      userId,
      type: emergencyType,
      status: "active",
      createdAt: new Date().toISOString(),
      location,
      responders: [],
      timeline: [],
    });
    router.replace("/sos/active");

    try {
      const alert = await triggerSOS({
        emergencyType,
        groups: groupsList,
        location,
      });
      markPerf("alert_created");
      setActiveAlert(alert);
    } catch (error) {
      if (error instanceof ApiError && error.code === "queued") {
        resetSOS();
        router.replace("/sos/pending" as Href);
        return;
      }
      resetSOS();
      router.replace("/(tabs)");
      setActivationError(
        error instanceof ApiError
          ? error.message
          : error instanceof Error
            ? error.message
            : "SOS failed. Please try again.",
      );
    }
  };

  const handleCountdownCancel = () => {
    setCountdown(null);
    cancelArming();
    setActivating(false);
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
            {sosInProgress
              ? "SOS alert in progress"
              : readiness.ready
                ? "You are protected"
                : "Finish your safety setup"}
          </Text>
        </View>

        <ReadinessBanner readiness={readiness} />

        <EmergencyDisclaimer compact className="mb-4" />

        {sosInProgress && (
          <Text variant="body" muted className="mb-4">
            Return to your active alert to see responders and end the alert.
          </Text>
        )}

        <EmergencyTypePicker />

        <View className="my-6 items-center">
          <SOSButton onActivate={handleSOSComplete} disabled={!sosEnabled} />
        </View>

        {activationError && (
          <Text variant="caption" className="mb-4 text-center text-emergency">
            {activationError}
          </Text>
        )}

        <View className="mt-6">
          <TripWatchBanner />
        </View>

        <View className="mt-10">
          <NearbyResponders />
        </View>
      </ScrollView>

      {countdown !== null && sosEnabled && (
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
