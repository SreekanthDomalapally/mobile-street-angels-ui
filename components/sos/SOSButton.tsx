import { Text } from "@/components/ui/Text";
import { sosConfig } from "@/constants/theme";
import { useSettingsStore } from "@/stores/settingsStore";
import { useSOSStore } from "@/stores/sosStore";
import * as Haptics from "expo-haptics";
import { useCallback, useEffect, useRef, useState } from "react";
import { Pressable, View } from "react-native";
import Animated, {
  Easing,
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

export function SOSButton({ onActivate, disabled = false }: SOSButtonProps) {
  const holdDuration = useSettingsStore((s) => s.emergency.holdDurationMs);
  const { status, holdProgress, startArming, cancelArming, setHoldProgress } =
    useSOSStore();
  const holdTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  const holdCompleted = useRef(false);
  const [isPressed, setIsPressed] = useState(false);
  const [holdHint, setHoldHint] = useState<string | null>(null);
  const pulse = useSharedValue(1);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1.08, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [
      {
        scale:
          status === "idle" && !isPressed ? pulse.value : 1,
      },
    ],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: 0.3 + holdProgress * 0.5,
    transform: [{ scale: 1 + holdProgress * 0.15 }],
  }));

  const clearHold = useCallback(() => {
    if (holdTimer.current) {
      clearInterval(holdTimer.current);
      holdTimer.current = null;
    }
    cancelArming();
    setIsPressed(false);
  }, [cancelArming]);

  const startHold = useCallback(() => {
    if (disabled || status !== "idle") return;
    holdCompleted.current = false;
    setHoldHint(null);
    setIsPressed(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startArming();
    const start = Date.now();
    holdTimer.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / holdDuration, 1);
      setHoldProgress(progress);
      if (progress >= 1) {
        holdCompleted.current = true;
        clearHold();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        onActivate();
      }
    }, 50);
  }, [
    disabled,
    status,
    holdDuration,
    startArming,
    setHoldProgress,
    clearHold,
    onActivate,
  ]);

  const endHold = useCallback(() => {
    if (holdCompleted.current) return;

    const progress = useSOSStore.getState().holdProgress;
    if (progress > 0 && progress < 1) {
      setHoldHint(`Keep holding for ${holdDuration / 1000} seconds to request help`);
    }
    clearHold();
  }, [clearHold, holdDuration]);

  const isArming = status === "arming";

  return (
    <View
      className="items-center"
      accessibilityLabel="Emergency SOS button. Press and hold to activate."
    >
      <AnimatedView
        pointerEvents="none"
        style={pulseStyle}
        className="absolute h-52 w-52 rounded-full bg-emergency/10"
      />
      <AnimatedView
        pointerEvents="none"
        style={ringStyle}
        className="absolute h-56 w-56 rounded-full bg-emergency/20"
      />
      <Pressable
        onPressIn={startHold}
        onPressOut={endHold}
        disabled={disabled || (status !== "idle" && status !== "arming")}
        className={`h-48 w-48 items-center justify-center rounded-full shadow-lg ${
          disabled ? "bg-emergency/40" : "bg-emergency"
        }`}
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
            <View
              className="h-full rounded-full bg-white"
              style={{ width: `${holdProgress * 100}%` }}
            />
          </View>
        )}
      </Pressable>
      <Text variant="caption" muted className="mt-6 text-center">
        Hold {sosConfig.holdDurationMs / 1000}s · then{" "}
        {sosConfig.countdownSeconds}s countdown
      </Text>
      {holdHint && (
        <Text variant="caption" className="mt-2 text-center text-warning">
          {holdHint}
        </Text>
      )}
    </View>
  );
}
