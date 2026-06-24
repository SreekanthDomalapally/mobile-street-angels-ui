import { Text } from "@/components/ui/Text";
import { fallbackEmergencyTypes, useEmergencyTypes } from "@/hooks/useEmergencyCatalog";
import { useGroups } from "@/hooks/useGroups";
import {
  countCirclesForEmergencyType,
  formatEmergencyTypeCircleCount,
} from "@/lib/groupLabels";
import { useSOSStore } from "@/stores/sosStore";
import type { EmergencyType } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Pressable, View } from "react-native";

const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
  medkit: "medkit-outline",
  shield: "shield-outline",
  car: "car-outline",
  "hand-left": "hand-left-outline",
  compass: "compass-outline",
  "help-buoy": "help-buoy-outline",
  "ellipsis-horizontal": "ellipsis-horizontal-circle-outline",
};

export function EmergencyTypePicker() {
  const { emergencyType, setEmergencyType, status } = useSOSStore();
  const { data } = useEmergencyTypes();
  const { data: groups } = useGroups();
  const types = data ?? fallbackEmergencyTypes;
  const disabled = status !== "idle";

  return (
    <View>
      <Text variant="label" className="mb-3 px-1">
        Emergency type
      </Text>
      <View className="flex-row flex-wrap justify-between gap-y-2 px-1">
        {types.map((type) => {
          const selected = emergencyType === type.code;
          const circleCount = groups
            ? countCirclesForEmergencyType(groups, type.code as EmergencyType)
            : null;
          return (
            <Pressable
              key={type.code}
              onPress={() => {
                if (disabled) return;
                Haptics.selectionAsync();
                setEmergencyType(type.code as EmergencyType);
              }}
              disabled={disabled}
              className={`min-h-[56px] w-[48%] flex-row items-center gap-2 rounded-2xl border px-3 py-3 ${
                selected
                  ? "border-emergency/50 bg-emergency/15"
                  : "border-glass-border bg-charcoal-800"
              } ${disabled ? "opacity-50" : ""}`}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={
                circleCount !== null
                  ? `${type.name}, ${formatEmergencyTypeCircleCount(circleCount)}`
                  : type.name
              }
            >
              <Ionicons
                name={iconMap[type.icon] ?? "help-circle-outline"}
                size={20}
                color={selected ? "#e85d5d" : "#a0a0a8"}
              />
              <View className="min-w-0 flex-1">
                <Text
                  variant="body"
                  numberOfLines={1}
                  className={selected ? "text-emergency-glow" : ""}
                >
                  {type.name}
                </Text>
                {circleCount !== null ? (
                  <Text
                    variant="caption"
                    muted
                    numberOfLines={1}
                    className={circleCount === 0 ? "text-emergency/80" : ""}
                  >
                    {formatEmergencyTypeCircleCount(circleCount)}
                  </Text>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
