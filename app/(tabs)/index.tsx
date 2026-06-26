import { ReadinessBanner } from "@/components/home/ReadinessBanner";
import { SosNotifyContacts } from "@/components/home/SosNotifyContacts";
import { StatusIndicator } from "@/components/home/StatusIndicator";
import { TripWatchBanner } from "@/components/home/TripWatchBanner";
import { CountdownOverlay } from "@/components/sos/CountdownOverlay";
import { EmergencyDisclaimer } from "@/components/sos/EmergencyDisclaimer";
import { EmergencyTypePicker } from "@/components/sos/EmergencyTypePicker";
import { SOSButton } from "@/components/sos/SOSButton";
import { AppLogo } from "@/components/ui/AppLogo";
import { Text } from "@/components/ui/Text";
import { useGroups } from "@/hooks/useGroups";
import { useSOSReadiness } from "@/hooks/useSOSReadiness";
import {
  countUsersForEmergencyType,
  getSosGroupForEmergencyType,
} from "@/lib/groupLabels";
import { markPerf } from "@/lib/perf";
import { formatSosStartedAt } from "@/lib/utils";
import { logSosEvent } from "@/lib/sosLog";
import { ApiError } from "@/services/api/client";
import { getSOSLocation } from "@/services/location";
import { triggerSOS } from "@/services/sos";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { isSOSLive, useSOSStore } from "@/stores/sosStore";
import { router, useFocusEffect, type Href } from "expo-router";
import { useCallback, useEffect } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const userId = useAuthStore((s) => s.user?.id);
  const { readiness } = useSOSReadiness();
  const { data: groups } = useGroups();
  const countdownSeconds = useSettingsStore(
    (s) => s.emergency.countdownSeconds,
  );
  const defaultSosGroupId = useSettingsStore(
    (s) => s.emergency.defaultSosGroupId,
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

      // Abandoned mid-hold only — do not reset during countdown overlay.
      if (
        !state.activeAlert &&
        state.status === "arming" &&
        state.countdown === null
      ) {
        resetSOS();
      }
    }, [resetSOS]),
  );

  const handleSOSComplete = () => {
    if (!sosEnabled || isSOSLive() || countdown !== null) return;
    markPerf("sos_press");
    setActivationError(null);
    setCountdown(countdownSeconds);
  };

  const handleCountdownComplete = async () => {
    try {
      if (!readiness.ready) {
        setActivationError(
          readiness.reason ?? "Complete setup before sending SOS.",
        );
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
        setActivationError(
          "Create a trusted group before sending an SOS alert.",
        );
        setCountdown(null);
        cancelArming();
        return;
      }

      const selectedGroupId = getSosGroupForEmergencyType(
        groupsList,
        emergencyType,
        defaultSosGroupId,
      );
      const recipientCount = countUsersForEmergencyType(
        groupsList,
        emergencyType,
        userId,
      );
      if (recipientCount < 1) {
        setActivating(false);
        setCountdown(null);
        cancelArming();
        setActivationError(
          "Add at least one contact to a circle linked to this emergency type before sending SOS.",
        );
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

      try {
        logSosEvent('SOS_BUTTON_PRESSED', {
          sender_user_id: useAuthStore.getState().user?.id,
          selected_emergency_type: emergencyType,
          recipient_count: recipientCount,
        });
        logSosEvent("SOS_TRIGGERED", {
          sender_user_id: useAuthStore.getState().user?.id,
          recipient_count: recipientCount,
        });
        const alert = await triggerSOS({
          emergencyType,
          groups: groupsList,
          groupId: selectedGroupId,
          location,
        });
        markPerf("alert_created");
        logSosEvent("ALERT_CREATED", {
          alert_id: alert.id,
          sender_user_id: alert.userId,
          recipient_count: alert.recipientCount,
          correlation_id: undefined,
        });
        setActiveAlert(alert);
        setCountdown(null);
        setActivating(false);
        router.replace("/sos/active");
      } catch (error) {
        setActivating(false);
        setCountdown(null);
        cancelArming();
        if (error instanceof ApiError && error.code === "queued") {
          resetSOS();
          router.replace("/sos/pending" as Href);
          return;
        }
        setActivationError(
          error instanceof ApiError
            ? error.message
            : error instanceof Error
              ? error.message
              : "SOS failed. Please try again.",
        );
      }
    } catch (error) {
      console.warn("[sos] Activation failed:", error);
      setActivating(false);
      setCountdown(null);
      cancelArming();
      setActivationError(
        error instanceof Error
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

        {sosInProgress && activeAlert?.createdAt && (
          <Text variant="body" muted className="mb-4">
            SOS started {formatSosStartedAt(activeAlert.createdAt)}. Return to your
            active alert to see responders and end the alert.
          </Text>
        )}

        <EmergencyTypePicker />

        <View className="my-6 items-center">
          <SOSButton
            onActivate={handleSOSComplete}
            disabled={!sosEnabled || countdown !== null}
          />
        </View>

        {activationError && (
          <Text variant="caption" className="mb-4 text-center text-emergency">
            {activationError}
          </Text>
        )}

        <SosNotifyContacts />

        <View className="mt-6">
          <TripWatchBanner />
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
