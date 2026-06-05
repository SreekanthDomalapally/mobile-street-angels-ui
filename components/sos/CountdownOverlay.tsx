import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { useSOSStore } from "@/stores/sosStore";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Modal, Pressable, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";

interface CountdownOverlayProps {
  seconds: number;
  loading?: boolean;
  onComplete: () => void;
  onCancel: () => void;
}

export function CountdownOverlay({
  seconds,
  loading = false,
  onComplete,
  onCancel,
}: CountdownOverlayProps) {
  const countdown = useSOSStore((s) => s.countdown);
  const setCountdown = useSOSStore((s) => s.setCountdown);
  const scale = useSharedValue(1);

  useEffect(() => {
    if (countdown === null) setCountdown(seconds);
  }, [countdown, seconds, setCountdown]);

  useEffect(() => {
    if (loading || countdown === null || countdown <= 0) return;

    scale.value = withSequence(
      withTiming(1.2, { duration: 150 }),
      withTiming(1, { duration: 150 }),
    );
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    const timer = setTimeout(() => {
      if (countdown <= 1) {
        onComplete();
      } else {
        setCountdown(countdown - 1);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown, loading, onComplete, setCountdown, scale]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (countdown === null) return null;

  return (
    <Modal transparent animationType="fade" visible accessibilityViewIsModal>
      <View className="flex-1 items-center justify-center bg-black/90 px-8">
        <Text variant="body" muted className="mb-8 text-center">
          {loading ? "Sending alert to your trusted group…" : "Sending alert in…"}
        </Text>
        <Animated.View
          style={animStyle}
          className="mb-12 h-32 w-32 items-center justify-center rounded-full border-4 border-emergency"
        >
          <Text variant="hero" className="text-emergency-glow">
            {loading ? "…" : countdown}
          </Text>
        </Animated.View>
        <Text variant="caption" muted className="mb-8 text-center">
          {loading ? "Please wait" : "Release or tap cancel to stop"}
        </Text>
        <Button
          title="Cancel alert"
          variant="secondary"
          onPress={onCancel}
          disabled={loading}
        />
        <Pressable
          className="mt-4 p-4"
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel="Cancel SOS alert"
        >
          <Text variant="caption" muted>
            Tap anywhere to cancel
          </Text>
        </Pressable>
      </View>
    </Modal>
  );
}
