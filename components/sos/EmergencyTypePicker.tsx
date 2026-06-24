import { Text } from "@/components/ui/Text";
import { getSelectedSosGroupId } from "@/components/home/SosGroupPicker";
import { fallbackEmergencyTypes, useEmergencyTypes } from "@/hooks/useEmergencyCatalog";
import { useGroups } from "@/hooks/useGroups";
import {
  countCirclesForEmergencyType,
  countUsersForEmergencyType,
  countUsersForEmergencyTypeInGroup,
  formatEmergencyTypeCircleCount,
  formatEmergencyTypeCircleCountBadge,
} from "@/lib/groupLabels";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { useSOSStore } from "@/stores/sosStore";
import type { EmergencyType } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useMemo } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

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
  const { data: typesCatalog } = useEmergencyTypes();
  const { data: groups, isLoading: groupsLoading } = useGroups();
  const currentUserId = useAuthStore((s) => s.user?.id);
  const preferredGroupId = useSettingsStore((s) => s.emergency.defaultSosGroupId);
  const types = typesCatalog ?? fallbackEmergencyTypes;
  const disabled = status !== "idle";

  const selectedGroup = useMemo(() => {
    if (!groups?.length) return undefined;
    const id = getSelectedSosGroupId(groups, preferredGroupId);
    return groups.find((g) => g.id === id);
  }, [groups, preferredGroupId]);

  return (
    <View>
      <Text variant="label" className="mb-3 px-1">
        Emergency type
      </Text>
      <View className="flex-row flex-wrap justify-between gap-y-2 px-1">
        {types.map((type) => {
          const selected = emergencyType === type.code;
          const code = type.code as EmergencyType;
          const circleCount = groups ? countCirclesForEmergencyType(groups, code) : null;
          const userCount = groups
            ? selectedGroup
              ? countUsersForEmergencyTypeInGroup(selectedGroup, code, currentUserId)
              : countUsersForEmergencyType(groups, code, currentUserId)
            : null;
          const countLabel =
            circleCount !== null
              ? `${formatEmergencyTypeCircleCount(circleCount)}, ${userCount ?? 0} people`
              : null;
          return (
            <Pressable
              key={type.code}
              onPress={() => {
                if (disabled) return;
                Haptics.selectionAsync();
                setEmergencyType(code);
              }}
              disabled={disabled}
              className={`min-h-[52px] w-[48%] flex-row items-center gap-2 rounded-2xl border px-3 py-2.5 ${
                selected
                  ? "border-emergency/50 bg-emergency/15"
                  : "border-glass-border bg-charcoal-800"
              } ${disabled ? "opacity-50" : ""}`}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={countLabel ? `${type.name}, ${countLabel}` : type.name}
            >
              <Ionicons
                name={iconMap[type.icon] ?? "help-circle-outline"}
                size={20}
                color={selected ? "#e85d5d" : "#a0a0a8"}
              />
              <Text
                variant="body"
                numberOfLines={1}
                className={`min-w-0 flex-1 ${selected ? "text-emergency-glow" : ""}`}
              >
                {type.name}
              </Text>
              {circleCount !== null && userCount !== null ? (
                <View className="flex-row items-center gap-1">
                  <View
                    className={`min-w-[24px] items-center rounded-full px-1.5 py-0.5 ${
                      circleCount === 0
                        ? "bg-emergency/15"
                        : selected
                          ? "bg-emergency/25"
                          : "bg-responder/20"
                    }`}
                  >
                    <Text
                      variant="label"
                      className={`normal-case text-xs ${
                        circleCount === 0
                          ? "text-emergency-glow"
                          : selected
                            ? "text-emergency-glow"
                            : "text-responder-light"
                      }`}
                    >
                      {formatEmergencyTypeCircleCountBadge(circleCount)}
                    </Text>
                  </View>
                  <View
                    className={`min-w-[24px] items-center rounded-full px-1.5 py-0.5 ${
                      userCount === 0 ? "bg-emergency/15" : "bg-[#2563eb33]"
                    }`}
                  >
                    <Text
                      variant="label"
                      className={`normal-case text-xs ${
                        userCount === 0 ? "text-emergency-glow" : "text-[#93c5fd]"
                      }`}
                    >
                      {String(userCount)}
                    </Text>
                  </View>
                </View>
              ) : groupsLoading ? (
                <ActivityIndicator size="small" color="#6d6d75" />
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
