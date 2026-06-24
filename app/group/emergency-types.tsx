import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { fallbackEmergencyTypes, useEmergencyTypes } from "@/hooks/useEmergencyCatalog";
import {
  useGroupEmergencyTypes,
  useSetGroupEmergencyTypes,
} from "@/hooks/useGroupEmergencyTypes";
import { useGroups } from "@/hooks/useGroups";
import { getEmergencyTypeLabel } from "@/lib/emergencyTypeLabels";
import {
  countCirclesForEmergencyType,
  formatEmergencyTypeCircleCount,
} from "@/lib/groupLabels";
import type { EmergencyType } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ICON_MAP: Record<string, keyof typeof Ionicons.glyphMap> = {
  medkit: "medkit-outline",
  shield: "shield-outline",
  car: "car-outline",
  "hand-left": "hand-left-outline",
  compass: "compass-outline",
  "ellipsis-horizontal": "ellipsis-horizontal-circle-outline",
};

export default function GroupEmergencyTypesScreen() {
  const insets = useSafeAreaInsets();
  const { groupId, name } = useLocalSearchParams<{ groupId: string; name?: string }>();

  const { data: catalog } = useEmergencyTypes();
  const types = catalog ?? fallbackEmergencyTypes;
  const current = useGroupEmergencyTypes(groupId);
  const save = useSetGroupEmergencyTypes(groupId ?? "");
  const { data: groups } = useGroups();

  const [selected, setSelected] = useState<Set<EmergencyType>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  const circleCountForType = (code: EmergencyType) =>
    groupId
      ? countCirclesForEmergencyType(groups, code, {
          groupId,
          types: [...selected],
        })
      : countCirclesForEmergencyType(groups, code);

  useEffect(() => {
    if (!hydrated && current.data) {
      setSelected(new Set(current.data));
      setHydrated(true);
    }
  }, [hydrated, current.data]);

  const toggle = (code: EmergencyType) => {
    Haptics.selectionAsync();
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code);
      else next.add(code);
      return next;
    });
  };

  const handleSave = async () => {
    try {
      await save.mutateAsync(Array.from(selected));
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.warn("[group-emergency-types] save failed:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-charcoal-950"
      contentContainerStyle={{
        paddingTop: insets.top + 8,
        paddingBottom: insets.bottom + 40,
        paddingHorizontal: 20,
      }}
    >
      <View className="mb-6 flex-row items-center gap-3">
        <Pressable
          onPress={() => router.back()}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          className="h-10 w-10 items-center justify-center rounded-xl bg-charcoal-800"
        >
          <Ionicons name="chevron-back" size={22} color="#a0a0a8" />
        </Pressable>
        <View className="flex-1">
          <Text variant="title">Emergency types</Text>
          {name ? (
            <Text variant="caption" muted>
              {name}
            </Text>
          ) : null}
        </View>
      </View>

      <Text variant="caption" muted className="mb-6">
        Choose which emergencies this circle should respond to. When someone sends an SOS, only
        circles that handle that type are alerted. Leave all off to receive every type.
      </Text>

      {current.isLoading ? (
        <View className="items-center py-16">
          <ActivityIndicator color="#6bb892" />
        </View>
      ) : (
        <>
          <View className="mb-8 gap-2">
            {types.map((type) => {
              const isSelected = selected.has(type.code);
              const circleCount = circleCountForType(type.code);
              return (
                <Pressable
                  key={type.code}
                  onPress={() => toggle(type.code)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isSelected }}
                  className={`min-h-[60px] flex-row items-center gap-3 rounded-2xl border px-4 py-3 ${
                    isSelected
                      ? "border-responder/60 bg-responder/15"
                      : "border-glass-border bg-charcoal-900"
                  }`}
                >
                  <Ionicons
                    name={ICON_MAP[type.icon] ?? "help-circle-outline"}
                    size={22}
                    color={isSelected ? "#6bb892" : "#a0a0a8"}
                  />
                  <View className="flex-1">
                    <Text variant="body" className={isSelected ? "text-responder-light" : ""}>
                      {getEmergencyTypeLabel(type.code)}
                    </Text>
                    {circleCount > 0 ? (
                      <Text variant="caption" className="mt-0.5 text-responder-light">
                        {formatEmergencyTypeCircleCount(circleCount)} respond to this
                      </Text>
                    ) : (
                      <Text variant="caption" muted className="mt-0.5">
                        No circles respond to this yet
                      </Text>
                    )}
                  </View>
                  {isSelected && <Ionicons name="checkmark-circle" size={22} color="#6bb892" />}
                </Pressable>
              );
            })}
          </View>

          <Button title="Save" onPress={handleSave} loading={save.isPending} />
        </>
      )}
    </ScrollView>
  );
}
