import { Text } from "@/components/ui/Text";
import { colors } from "@/constants/theme";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";

interface EmptyStateProps {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  icon = "shield-outline",
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 py-16">
      <View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-charcoal-800">
        <Ionicons name={icon} size={32} color={colors.textMuted} />
      </View>
      <Text variant="subtitle" className="mb-2 text-center">
        {title}
      </Text>
      {description && (
        <Text variant="body" muted className="mb-6 text-center">
          {description}
        </Text>
      )}
      {action}
    </View>
  );
}
