import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import { useGroups } from '@/hooks/useGroups';
import { getEmergencyTypeLabel } from '@/lib/emergencyTypeLabels';
import {
  countCirclesForEmergencyType,
  countUsersForEmergencyType,
  formatEmergencyTypeCircleCount,
  getUniqueMembersForEmergencyType,
} from '@/lib/groupLabels';
import { useAuthStore } from '@/stores/authStore';
import { useSOSStore } from '@/stores/sosStore';
import { type Href, router } from 'expo-router';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';

export function SosNotifyContacts() {
  const emergencyType = useSOSStore((s) => s.emergencyType);
  const { data: groups, isLoading } = useGroups();
  const userId = useAuthStore((s) => s.user?.id);

  const contacts = useMemo(
    () => getUniqueMembersForEmergencyType(groups, emergencyType, userId),
    [groups, emergencyType, userId],
  );

  const circleCount = countCirclesForEmergencyType(groups, emergencyType);
  const contactCount = countUsersForEmergencyType(groups, emergencyType, userId);
  const typeLabel = getEmergencyTypeLabel(emergencyType);

  return (
    <View className="mt-6">
      <Text variant="label" className="mb-1">
        Emergency contacts
      </Text>
      <Text variant="caption" muted className="mb-3">
        Unique contacts in circles linked to {typeLabel.toLowerCase()}.
      </Text>

      {isLoading ? (
        <View className="items-center py-6">
          <ActivityIndicator size="small" color="#6d6d75" />
        </View>
      ) : contactCount === 0 ? (
        <Pressable
          onPress={() => router.push('/(tabs)/groups' as Href)}
          className="rounded-2xl border border-dashed border-glass-border px-4 py-5 active:bg-charcoal-900"
          accessibilityRole="button"
          accessibilityLabel="Add contacts to your circles"
        >
          <Text variant="body" className="text-center text-responder-light">
            No contacts for this emergency type. Add people to a linked circle.
          </Text>
        </Pressable>
      ) : contacts.length > 0 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {contacts.map((contact) => (
            <View key={contact.userId} className="mr-4 w-24 items-center">
              <Avatar name={contact.displayName} size="md" />
              <Text variant="caption" numberOfLines={2} className="mt-2 text-center font-medium">
                {contact.displayName}
              </Text>
              {contact.groupNames.length > 0 && (
                <Text variant="label" muted numberOfLines={2} className="mt-1 text-center normal-case">
                  {contact.groupNames.join(', ')}
                </Text>
              )}
            </View>
          ))}
        </ScrollView>
      ) : (
        <View className="rounded-2xl border border-glass-border bg-charcoal-900 px-4 py-4">
          <Text variant="body" className="text-center">
            {contactCount === 1 ? '1 contact' : `${contactCount} contacts`}
          </Text>
          <Text variant="caption" muted className="mt-1 text-center">
            {formatEmergencyTypeCircleCount(circleCount)} linked to {typeLabel.toLowerCase()}
          </Text>
        </View>
      )}
    </View>
  );
}
