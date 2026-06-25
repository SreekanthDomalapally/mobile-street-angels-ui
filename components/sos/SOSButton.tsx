import { Text } from "@/components/ui/Text";
import { getEmergencyTypeColors } from "@/lib/emergencyTypeColors";
import { useSettingsStore } from "@/stores/settingsStore";
import { useSOSStore } from "@/stores/sosStore";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const AnimatedView = Animated.createAnimatedComponent(View);

interface SOSButtonProps {
  onActivate: () => void;
  disabled?: boolean;
}

function safeHaptic(fn: () => Promise<void>) {
  void fn().catch(() => undefined);
}

export function SOSButton({ onActivate, disabled = false }: SOSButtonProps) {
  const holdDuration = useSettingsStore((s) => s.emergency.holdDurationMs);
  const countdownSeconds = useSettingsStore((s) => s.emergency.countdownSeconds);
  const emergencyType = useSOSStore((s) => s.emergencyType);
  const status = useSOSStore((s) => s.status);
  const startArming = useSOSStore((s) => s.startArming);
  const finishArming = useSOSStore((s) => s.finishArming);
  const cancelArming = useSOSStore((s) => s.cancelArming);
  const typeColors = getEmergencyTypeColors(emergencyType);
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdCompleted = useRef(false);
  const onActivateRef = useRef(onActivate);
  const [holdHint, setHoldHint] = useState<string | null>(null);
  const pulse = useSharedValue(1);
  const holdProgress = useSharedValue(0);

  const setHoldProgressOnUI = useCallback((progress: number) => {
    runOnUI((value: number) => {
      holdProgress.value = value;
    })(progress);
  }, [holdProgress]);

  useEffect(() => {
    onActivateRef.current = onActivate;
  }, [onActivate]);

  useEffect(() => {
    if (disabled || status !== "idle") {
      pulse.value = 1;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [disabled, pulse, status]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + holdProgress.value * 0.5,
    transform: [{ scale: 1 + holdProgress.value * 0.15 }],
  }));

  const progressBarStyle = useAnimatedStyle(() => ({
    transform: [{ scaleX: holdProgress.value }],
  }));

  const stopHoldTimer = useCallback(() => {
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
  }, []);

  const resetHoldProgress = useCallback(() => {
    setHoldProgressOnUI(0);
  }, [setHoldProgressOnUI]);

  const releaseHold = useCallback(
    (completed: boolean) => {
      stopHoldTimer();
      resetHoldProgress();
      if (completed) {
        finishArming();
      } else {
        cancelArming();
      }
    },
    [cancelArming, finishArming, resetHoldProgress, stopHoldTimer],
  );

  const startHold = useCallback(() => {
    if (disabled || status !== "idle") return;
    holdCompleted.current = false;
    setHoldHint(null);
    safeHaptic(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium));
    startArming();
    const start = Date.now();
    holdTimer.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / holdDuration, 1);
      setHoldProgressOnUI(progress);
      if (progress >= 1) {
        holdCompleted.current = true;
        releaseHold(true);
        safeHaptic(() =>
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
        );
        onActivateRef.current();
      }
    }, 50);
  }, [disabled, status, holdDuration, startArming, setHoldProgressOnUI, releaseHold]);

  const endHold = useCallback(() => {
    if (holdCompleted.current) return;

    if (holdProgress.value > 0 && holdProgress.value < 1) {
      setHoldHint(`Keep holding for ${holdDuration / 1000} seconds to request help`);
    }
    releaseHold(false);
  }, [holdDuration, holdProgress, releaseHold]);

  useEffect(() => {
    return () => {
      stopHoldTimer();
    };
  }, [stopHoldTimer]);

  const isArming = status === "arming";

  return (
    <View
      className="items-center"
      accessibilityLabel="Emergency SOS button. Press and hold to activate."
    >
      <AnimatedView
        pointerEvents="none"
        style={[pulseStyle, { backgroundColor: typeColors.ring }]}
        className="absolute h-52 w-52 rounded-full"
      />
      <AnimatedView
        pointerEvents="none"
        style={[ringStyle, { backgroundColor: typeColors.ringOuter }]}
        className="absolute h-56 w-56 rounded-full"
      />
      <Pressable
        onPressIn={startHold}
        onPressOut={endHold}
        disabled={disabled || (status !== "idle" && status !== "arming")}
        style={{
          backgroundColor: disabled ? `${typeColors.primary}66` : typeColors.primary,
        }}
        className="h-48 w-48 items-center justify-center rounded-full shadow-lg"
        accessibilityRole="button"
        accessibilityHint={`Hold for ${holdDuration / 1000} seconds to send SOS`}
        accessibilityState={{ busy: isArming }}
      >
        <View className="items-center">
          <Text variant="hero" className="text-white">
            SOS
          </Text>
          <Text variant="caption" className="mt-1 text-white/80">
            {isArming ? "Keep holding…" : "Hold to alert"}
          </Text>
        </View>
        {isArming && (
          <View className="absolute bottom-4 left-4 right-4 h-1 overflow-hidden rounded-full bg-white/20">
            <AnimatedView
              className="h-full w-full origin-left rounded-full bg-white"
              style={progressBarStyle}
            />
          </View>
        )}
      </Pressable>
      <Text variant="caption" muted className="mt-6 text-center">
        Hold {holdDuration / 1000}s · then {countdownSeconds}s countdown
      </Text>
      {holdHint && (
        <Text variant="caption" className="mt-2 text-center text-warning">
          {holdHint}
        </Text>
      )}
    </View>
  );
}
