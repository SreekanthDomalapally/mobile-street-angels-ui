import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { SettingsRow } from "@/components/profile/SettingsRow";
import { useSkillCatalog } from "@/hooks/useEmergencyCatalog";
import {
  useMySkills,
  useResponderProfile,
  useSetMySkills,
  useUpdateResponderProfile,
} from "@/hooks/useResponderProfile";
import {
  BLOOD_GROUPS,
  type BloodGroup,
} from "@/lib/emergencyMedical";
import type { SkillLevel } from "@/types";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const VISIBILITY_OPTIONS: { value: string; label: string }[] = [
  { value: "groups", label: "My circles" },
  { value: "responders", label: "Active responders" },
  { value: "none", label: "Nobody" },
];

export default function ResponderProfileScreen() {
  const insets = useSafeAreaInsets();
  const catalog = useSkillCatalog();
  const mySkills = useMySkills();
  const profile = useResponderProfile();
  const setSkills = useSetMySkills();
  const updateProfile = useUpdateResponderProfile();

  const [selected, setSelected] = useState<Record<string, SkillLevel>>({});
  const [available, setAvailable] = useState(true);
  const [vehicle, setVehicle] = useState(false);
  const [visibility, setVisibility] = useState("groups");
  const [languages, setLanguages] = useState("");
  const [bloodGroup, setBloodGroup] = useState<BloodGroup | null>(null);
  const [medical, setMedical] = useState("");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (hydrated) return;
    if (mySkills.data && profile.data) {
      const next: Record<string, SkillLevel> = {};
      for (const s of mySkills.data) next[s.skillCode] = s.level;
      setSelected(next);
      setAvailable(profile.data.availableForEmergencies);
      setVehicle(profile.data.vehicleAvailable);
      setVisibility(profile.data.locationVisibility || "groups");
      setLanguages(profile.data.languages.join(", "));
      const savedBlood = profile.data.bloodGroup;
      setBloodGroup(
        savedBlood && BLOOD_GROUPS.includes(savedBlood as BloodGroup)
          ? (savedBlood as BloodGroup)
          : null,
      );
      setMedical(profile.data.medicalBackground ?? "");
      setHydrated(true);
    }
  }, [hydrated, mySkills.data, profile.data]);

  const categories = useMemo(() => {
    const groups: Record<string, typeof catalog.data> = {};
    for (const skill of catalog.data ?? []) {
      (groups[skill.category] ??= []).push(skill);
    }
    return groups;
  }, [catalog.data]);

  const toggleSkill = (code: string) => {
    Haptics.selectionAsync();
    setSelected((prev) => {
      const next = { ...prev };
      if (next[code]) delete next[code];
      else next[code] = "basic";
      return next;
    });
  };

  const handleSave = async () => {
    try {
      await setSkills.mutateAsync(
        Object.entries(selected).map(([skillCode, level]) => ({ skillCode, level }))
      );
      await updateProfile.mutateAsync({
        availableForEmergencies: available,
        vehicleAvailable: vehicle,
        locationVisibility: visibility,
        languages: languages
          .split(",")
          .map((l) => l.trim())
          .filter(Boolean),
        bloodGroup: bloodGroup ?? "",
        medicalBackground: medical.trim() || undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.warn("[responder-profile] save failed:", error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const loading = catalog.isLoading || mySkills.isLoading || profile.isLoading;

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
        <Text variant="title">Responder profile</Text>
      </View>

      <Text variant="caption" muted className="mb-6">
        Your skills and availability help us send the right emergencies to you. Everything here
        is optional.
      </Text>

      {loading ? (
        <View className="items-center py-16">
          <ActivityIndicator color="#6bb892" />
        </View>
      ) : (
        <>
          <Text variant="label" className="mb-2">
            Availability
          </Text>
          <View className="mb-6 rounded-2xl border border-glass-border bg-charcoal-900 px-4">
            <SettingsRow
              label="Available for emergencies"
              description="Turn off if you don't want to be alerted"
              value={available}
              onToggle={setAvailable}
            />
            <SettingsRow
              label="Vehicle available"
              description="You can reach people who need a pickup or breakdown help"
              value={vehicle}
              onToggle={setVehicle}
            />
          </View>

          <Text variant="label" className="mb-2">
            Your skills
          </Text>
          <Text variant="caption" muted className="mb-3">
            Select anything you're comfortable helping with.
          </Text>
          {Object.entries(categories).map(([category, skills]) => (
            <View key={category} className="mb-4">
              <Text variant="caption" muted className="mb-2 capitalize">
                {category}
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {(skills ?? []).map((skill) => {
                  const isSelected = Boolean(selected[skill.code]);
                  return (
                    <Pressable
                      key={skill.code}
                      onPress={() => toggleSkill(skill.code)}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: isSelected }}
                      className={`min-h-[44px] flex-row items-center gap-2 rounded-full border px-4 py-2 ${
                        isSelected
                          ? "border-responder/60 bg-responder/15"
                          : "border-glass-border bg-charcoal-800"
                      }`}
                    >
                      {isSelected && (
                        <Ionicons name="checkmark" size={16} color="#6bb892" />
                      )}
                      <Text
                        variant="body"
                        className={isSelected ? "text-responder-light" : ""}
                      >
                        {skill.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          ))}

          <Text variant="label" className="mb-2 mt-2">
            Location sharing
          </Text>
          <Text variant="caption" muted className="mb-3">
            Who can see your distance when an emergency is nearby.
          </Text>
          <View className="mb-6 flex-row gap-2">
            {VISIBILITY_OPTIONS.map((option) => {
              const isSelected = visibility === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setVisibility(option.value);
                  }}
                  className={`min-h-[44px] flex-1 items-center justify-center rounded-xl border px-2 py-3 ${
                    isSelected
                      ? "border-responder/60 bg-responder/15"
                      : "border-glass-border bg-charcoal-800"
                  }`}
                >
                  <Text
                    variant="caption"
                    className={`text-center ${isSelected ? "text-responder-light" : ""}`}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text variant="label" className="mb-2">
            Languages
          </Text>
          <TextInput
            value={languages}
            onChangeText={setLanguages}
            placeholder="e.g. English, Spanish"
            placeholderTextColor="#6b6b73"
            className="mb-6 rounded-2xl border border-glass-border bg-charcoal-900 px-4 py-4 text-base text-white"
          />

          <Text variant="label" className="mb-2">
            Blood group
          </Text>
          <Text variant="caption" muted className="mb-3">
            Shared with circle members when you send a medical or safety SOS.
          </Text>
          <View className="mb-6 flex-row flex-wrap gap-2">
            {BLOOD_GROUPS.map((group) => {
              const isSelected = bloodGroup === group;
              return (
                <Pressable
                  key={group}
                  onPress={() => {
                    Haptics.selectionAsync();
                    setBloodGroup(isSelected ? null : group);
                  }}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  className={`min-h-[44px] min-w-[56px] items-center justify-center rounded-full border px-4 py-2 ${
                    isSelected
                      ? "border-responder/60 bg-responder/15"
                      : "border-glass-border bg-charcoal-800"
                  }`}
                >
                  <Text variant="body" className={isSelected ? "text-responder-light" : ""}>
                    {group}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          <Text variant="label" className="mb-2">
            Medical background
          </Text>
          <TextInput
            value={medical}
            onChangeText={setMedical}
            placeholder="Anything responders should know (optional)"
            placeholderTextColor="#6b6b73"
            multiline
            className="mb-8 min-h-[88px] rounded-2xl border border-glass-border bg-charcoal-900 px-4 py-4 text-base text-white"
            textAlignVertical="top"
          />

          <Button
            title="Save profile"
            onPress={handleSave}
            loading={setSkills.isPending || updateProfile.isPending}
          />
        </>
      )}
    </ScrollView>
  );
}
