import { Text } from "@/components/ui/Text";
import { emergencyTypes } from "@/data/mock";
import { useSOSStore } from "@/stores/sosStore";
import type { EmergencyType } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pressable, View } from "react-native";

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  medkit: "medkit-outline",
  shield: "shield-outline",
  "alert-circle": "alert-circle-outline",
  car: "car-outline",
  "help-circle": "help-circle-outline",
};

export function EmergencyTypePicker() {
  const { emergencyType, setEmergencyType, status } = useSOSStore();
  const disabled = status !== "idle";

  return (
    <View>
      <Text variant="label" className="mb-3 px-1">
        Emergency type
      </Text>
      <View className="flex-row flex-wrap justify-between gap-y-2 px-1">
        {emergencyTypes.map((type) => {
          const selected = emergencyType === type.id;
          return (
            <Pressable
              key={type.id}
              onPress={() => {
                if (disabled) return;
                Haptics.selectionAsync();
                setEmergencyType(type.id as EmergencyType);
              }}
              disabled={disabled}
              className={`min-h-[48px] w-[48%] flex-row items-center gap-2 rounded-2xl border px-3 py-3 ${
                selected
                  ? "border-emergency/50 bg-emergency/15"
                  : "border-glass-border bg-charcoal-800"
              } ${disabled ? "opacity-50" : ""}`}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
            >
              <Ionicons
                name={iconMap[type.icon] ?? "help-circle-outline"}
                size={20}
                color={selected ? "#e85d5d" : "#a0a0a8"}
              />
              <Text
                variant="body"
                className={`shrink ${selected ? "text-emergency-glow" : ""}`}
              >
                {type.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
