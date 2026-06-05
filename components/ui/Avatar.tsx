import { View } from "react-native";
import { Text } from "./Text";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  online?: boolean;
}

const sizes = { sm: 36, md: 48, lg: 64 };

export function Avatar({ name, size = "md", online }: AvatarProps) {
  const dim = sizes[size];
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <View className="relative">
      <View
        style={{ width: dim, height: dim }}
        className="items-center justify-center rounded-full bg-charcoal-700"
        accessibilityLabel={`${name} avatar`}
      >
        <Text variant="caption" className="font-semibold text-charcoal-200">
          {initials}
        </Text>
      </View>
      {online != null && (
        <View
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-charcoal-950 ${online ? "bg-responder" : "bg-charcoal-500"}`}
          accessibilityLabel={online ? "Online" : "Offline"}
        />
      )}
    </View>
  );
}
