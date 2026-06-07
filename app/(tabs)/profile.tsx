import { SettingsRow } from "@/components/profile/SettingsRow";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import { APP_NAME } from "@/constants/branding";
import { getAppVersionLabel } from "@/lib/appVersion";
import { signOut as authSignOut } from "@/services/auth";
import { useAuthStore } from "@/stores/authStore";
import { useSettingsStore } from "@/stores/settingsStore";
import { router } from "expo-router";
import { Linking, Pressable, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const { notifications, emergency, updateNotifications, updateEmergency } =
    useSettingsStore();

  const handleSignOut = async () => {
    await authSignOut();
    signOut();
    router.replace("/(auth)/login");
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

      <Text variant="label" className="mb-2">
        Notifications
      </Text>
      <View className="mb-6 rounded-2xl border border-glass-border bg-charcoal-900 px-4">
        <SettingsRow
          label="Emergency alerts"
          value={notifications.emergencyAlerts}
          onToggle={(v) => updateNotifications({ emergencyAlerts: v })}
        />
        <SettingsRow
          label="Responder updates"
          value={notifications.responderUpdates}
          onToggle={(v) => updateNotifications({ responderUpdates: v })}
        />
        <SettingsRow
          label="Group updates"
          value={notifications.groupUpdates}
          onToggle={(v) => updateNotifications({ groupUpdates: v })}
        />
      </View>

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
          description="Haptic only, no sounds"
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

      <Text variant="caption" muted className="text-center">
        {APP_NAME} v{getAppVersionLabel()} · Free to use
      </Text>
    </ScrollView>
  );
}
