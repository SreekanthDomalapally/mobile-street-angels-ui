import { BlurView } from "expo-blur";
import { Platform, View, ViewProps } from "react-native";

interface GlassCardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  intensity?: number;
}

export function GlassCard({
  children,
  className = "",
  intensity = 40,
  ...props
}: GlassCardProps) {
  if (Platform.OS === "web") {
    return (
      <View
        className={`overflow-hidden rounded-3xl border border-glass-border bg-glass p-4 ${className}`}
        {...props}
      >
        {children}
      </View>
    );
  }

  return (
    <View
      className={`overflow-hidden rounded-3xl border border-glass-border ${className}`}
      {...props}
    >
      <BlurView intensity={intensity} tint="dark" className="p-4">
        {children}
      </BlurView>
    </View>
  );
}
