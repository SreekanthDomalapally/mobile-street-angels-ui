import {
  ActivityIndicator,
  Pressable,
  PressableProps,
  View,
} from "react-native";
import { Text } from "./Text";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "emergency";

interface ButtonProps extends PressableProps {
  title: string;
  variant?: Variant;
  loading?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  icon?: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary: "bg-responder active:bg-responder-muted",
  secondary:
    "bg-charcoal-800 border border-glass-border active:bg-charcoal-700",
  ghost: "bg-transparent active:bg-charcoal-800",
  danger: "bg-emergency-muted active:bg-emergency",
  emergency: "bg-emergency active:bg-emergency-glow",
};

const sizeClasses = {
  sm: "px-4 py-3 min-h-[44px]",
  md: "px-6 py-4 min-h-[52px]",
  lg: "px-8 py-5 min-h-[56px]",
};

export function Button({
  title,
  variant = "primary",
  loading,
  size = "md",
  className = "",
  icon,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <Pressable
      className={`flex-row items-center justify-center rounded-2xl ${variantClasses[variant]} ${sizeClasses[size]} ${disabled || loading ? "opacity-50" : ""} ${className}`}
      disabled={disabled || loading}
      accessibilityRole="button"
      accessibilityLabel={title}
      accessibilityState={{ disabled: !!disabled || !!loading }}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <View className="flex-row items-center gap-2">
          {icon}
          <Text
            variant="subtitle"
            className={`text-center ${variant === "ghost" ? "text-charcoal-200" : ""}`}
          >
            {title}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
