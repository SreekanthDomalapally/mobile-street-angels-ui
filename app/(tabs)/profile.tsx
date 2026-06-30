import { GroupInvitesSection } from "@/components/groups/GroupInvitesSection";
import { SettingsRow } from "@/components/profile/SettingsRow";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { APP_NAME } from "@/constants/branding";
import { getAppVersionLabel } from "@/lib/appVersion";
import { signOut as authSignOut } from "@/services/auth";
import { updateNotificationPreferences } from "@/services/api/preferences";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import {
  areDebugToolsEnabled,
  canUnlockSosDebugWithGesture,
  DEBUG_UNLOCK_TAPS,
  useDebugStore,
} from "@/stores/debugStore";
import { router } from "expo-router";
import { useCallback, useRef } from "react";
import { Alert, Linking, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const { notifications, emergency, updateNotifications, updateEmergency } =
    useSettingsStore();
  const debugUnlocked = useDebugStore((s) => s.unlocked);
  const setDebugUnlocked = useDebugStore((s) => s.setUnlocked);
  const debugToolsEnabled = areDebugToolsEnabled(debugUnlocked);
  const versionTapCount = useRef(0);

  const handleVersionTap = useCallback(() => {
    if (!canUnlockSosDebugWithGesture()) {
      return;
    }
    if (debugToolsEnabled) {
      return;
    }
    versionTapCount.current += 1;
    const remaining = DEBUG_UNLOCK_TAPS - versionTapCount.current;
    if (remaining <= 0) {
      versionTapCount.current = 0;
      setDebugUnlocked(true);
      Alert.alert("Debug tools unlocked", "SOS debug tools are now available.");
    } else if (remaining <= 3) {
      Alert.alert(
        "Developer mode",
        `${remaining} more tap${remaining === 1 ? "" : "s"} to unlock debug tools.`
      );
    }
  }, [debugToolsEnabled, setDebugUnlocked]);

  const handleNotificationToggle = useCallback(
    async (key: "responderUpdates" | "groupUpdates", value: boolean) => {
      const next = { ...notifications, [key]: value };
      updateNotifications({ [key]: value });
      try {
        await updateNotificationPreferences(next);
      } catch (error) {
        console.warn("[profile] Failed to sync notification preferences:", error);
      }
    },
    [notifications, updateNotifications]
  );

  const handleSignOut = async () => {
    await authSignOut();
    router.replace("/");
  };

  return (
    <ScrollView
      className="flex-1 bg-charcoal-950"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 100,
        paddingHorizontal: 20,
      }}
    >
      <View className="mb-8 flex-row items-center gap-4">
        <Avatar name={user?.displayName ?? "User"} size="lg" />
        <View>
          <Text variant="title">{user?.displayName ?? "Guest"}</Text>
          <Text variant="caption" muted>
            {user?.email ?? ""}
          </Text>
        </View>
      </View>

      <GroupInvitesSection />

      <Text variant="label" className="mb-2">
        Emergency readiness
      </Text>
      <View className="mb-6 rounded-2xl border border-glass-border bg-charcoal-900 px-4">
        <SettingsRow
          label="Responder profile"
          description="Skills, availability & how you can help"
          icon="medkit-outline"
          showChevron
          onPress={() => router.push("/responder-profile")}
        />
        {debugToolsEnabled ? (
          <SettingsRow
            label="SOS debug tools"
            description="Location, push, WebSocket tests"
            icon="bug-outline"
            showChevron
            onPress={() => router.push("/debug/sos")}
          />
        ) : null}
      </View>

      <Text variant="label" className="mb-2">
        Notifications
      </Text>
      <View className="mb-2 rounded-2xl border border-glass-border bg-charcoal-900 px-4">
        <SettingsRow
          label="Emergency SOS alerts"
          description="Always on — someone needs help"
          value={true}
          disabled
        />
        <SettingsRow
          label="Responder updates"
          value={notifications.responderUpdates}
          onToggle={(v) => handleNotificationToggle("responderUpdates", v)}
        />
        <SettingsRow
          label="Group updates"
          value={notifications.groupUpdates}
          onToggle={(v) => handleNotificationToggle("groupUpdates", v)}
        />
      </View>
      <Text variant="caption" muted className="mb-6">
        Incoming SOS alerts from trusted contacts cannot be turned off.
      </Text>

      <Text variant="label" className="mb-2">
        Emergency settings
      </Text>
      <View className="mb-6 rounded-2xl border border-glass-border bg-charcoal-900 px-4">
        <SettingsRow
          label="Share location by default"
          description="During active alerts only"
          value={emergency.shareLocationByDefault}
          onToggle={(v) => updateEmergency({ shareLocationByDefault: v })}
        />
        <SettingsRow
          label="Silent mode"
          description="Mute sounds; SOS alerts still show"
          value={emergency.silentMode}
          onToggle={(v) => updateEmergency({ silentMode: v })}
        />
      </View>

      <Text variant="label" className="mb-2">
        Support
      </Text>
      <View className="mb-6 rounded-2xl border border-glass-border bg-charcoal-900 px-4">
        <SettingsRow
          label="Privacy & data"
          icon="lock-closed-outline"
          showChevron
          onPress={() => Linking.openURL("https://youhooalert.com/privacy")}
        />
        <SettingsRow
          label="Contact support"
          icon="mail-outline"
          showChevron
          onPress={() => Linking.openURL("mailto:support@youhooalert.com")}
        />
        <SettingsRow
          label="Donate"
          description="Support the mission"
          icon="heart-outline"
          showChevron
          onPress={() => Linking.openURL("https://youhooalert.com/#donate")}
        />
      </View>

      <Button
        title="Sign out"
        variant="ghost"
        onPress={handleSignOut}
        className="mb-6"
      />

      <View className="mb-6 items-center px-2">
        <Text variant="caption" muted className="text-center leading-relaxed">
          {APP_NAME} is free for everyone. Optional donations help keep alerts, live location,
          and the platform available for people in need.
        </Text>
        <Pressable
          className="mt-3 py-2"
          accessibilityRole="link"
          accessibilityLabel="Donate to support the mission"
          onPress={() => Linking.openURL("https://youhooalert.com/#donate")}>
          <Text variant="body" className="text-center text-responder-light">
            Support the mission · Donate
          </Text>
        </Pressable>
      </View>

      <Pressable onPress={handleVersionTap} accessibilityRole="text">
        <Text variant="caption" muted className="text-center">
          {APP_NAME} v{getAppVersionLabel()} · Free to use
        </Text>
      </Pressable>
    </ScrollView>
  );
}
