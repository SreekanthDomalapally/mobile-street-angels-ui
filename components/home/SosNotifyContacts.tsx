import { Avatar } from '@/components/ui/Avatar';
import { Text } from '@/components/ui/Text';
import { useGroups } from '@/hooks/useGroups';
import { getEmergencyTypeLabel } from '@/lib/emergencyTypeLabels';
import {
  countCirclesForEmergencyType,
  countUsersForEmergencyType,
  formatEmergencyTypeCircleCount,
  getUniqueMembersForEmergencyType,
  groupHandlesEmergencyType,
  type EmergencyNotifyContact,
} from '@/lib/groupLabels';
import { fetchGroupWithMembers } from '@/services/api/groupMembers';
import { useAuthStore } from '@/stores/authStore';
import { useSOSStore } from '@/stores/sosStore';
import { Ionicons } from '@expo/vector-icons';
import { type Href, router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

export function SosNotifyContacts() {
  const emergencyType = useSOSStore((s) => s.emergencyType);
  const { data: groups, isLoading } = useGroups();
  const userId = useAuthStore((s) => s.user?.id);

  const [expanded, setExpanded] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchedContacts, setFetchedContacts] = useState<EmergencyNotifyContact[] | null>(null);

  const cachedContacts = useMemo(
    () => getUniqueMembersForEmergencyType(groups, emergencyType, userId),
    [groups, emergencyType, userId],
  );

  const matchingGroupIds = useMemo(() => {
    if (!groups?.length) return [];
    return groups.filter((g) => groupHandlesEmergencyType(g, emergencyType)).map((g) => g.id);
  }, [groups, emergencyType]);

  const circleCount = countCirclesForEmergencyType(groups, emergencyType);
  const contactCount = countUsersForEmergencyType(groups, emergencyType, userId);
  const typeLabel = getEmergencyTypeLabel(emergencyType);

  const contacts = fetchedContacts ?? cachedContacts;
  const displayCount = contacts.length > 0 ? contacts.length : contactCount;

  useEffect(() => {
    setExpanded(false);
    setFetchedContacts(null);
    setFetchError(null);
  }, [emergencyType]);

  const loadContacts = useCallback(async () => {
    if (cachedContacts.length > 0) {
      setFetchedContacts(cachedContacts);
      return;
    }
    if (!matchingGroupIds.length) {
      setFetchedContacts([]);
      return;
    }

    setFetching(true);
    setFetchError(null);
    try {
      const detailed = await Promise.all(matchingGroupIds.map((id) => fetchGroupWithMembers(id)));
      setFetchedContacts(getUniqueMembersForEmergencyType(detailed, emergencyType, userId));
    } catch (err) {
      setFetchError(err instanceof Error ? err.message : 'Could not load contacts.');
    } finally {
      setFetching(false);
    }
  }, [cachedContacts, matchingGroupIds, emergencyType, userId]);

  const toggleExpanded = async () => {
    if (expanded) {
      setExpanded(false);
      return;
    }
    setExpanded(true);
    if (fetchedContacts === null) {
      await loadContacts();
    }
  };

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
      ) : contactCount === 0 && cachedContacts.length === 0 ? (
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
      ) : (
        <View className="overflow-hidden rounded-2xl border border-glass-border bg-charcoal-900">
          <Pressable
            onPress={() => void toggleExpanded()}
            className="flex-row items-center px-4 py-4 active:bg-charcoal-800"
            accessibilityRole="button"
            accessibilityState={{ expanded }}
            accessibilityLabel={
              expanded
                ? 'Hide emergency contacts'
                : `Show ${displayCount} emergency contact${displayCount === 1 ? '' : 's'}`
            }
          >
            <View className="flex-1">
              <Text variant="body">
                {displayCount === 1 ? '1 contact' : `${displayCount} contacts`}
              </Text>
              <Text variant="caption" muted className="mt-1">
                {formatEmergencyTypeCircleCount(circleCount)} linked to {typeLabel.toLowerCase()}
              </Text>
            </View>
            {fetching ? (
              <ActivityIndicator size="small" color="#6d6d75" />
            ) : (
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#9ca3af"
              />
            )}
          </Pressable>

          {expanded && (
            <View className="border-t border-glass-border px-4 pb-4 pt-3">
              {fetching && contacts.length === 0 ? (
                <View className="items-center py-4">
                  <ActivityIndicator size="small" color="#6d6d75" />
                  <Text variant="caption" muted className="mt-2">
                    Loading contacts…
                  </Text>
                </View>
              ) : fetchError ? (
                <Pressable
                  onPress={() => void loadContacts()}
                  className="py-3 active:opacity-80"
                  accessibilityRole="button"
                  accessibilityLabel="Retry loading contacts"
                >
                  <Text variant="body" className="text-center text-emergency">
                    {fetchError}
                  </Text>
                  <Text variant="caption" muted className="mt-1 text-center">
                    Tap to retry
                  </Text>
                </Pressable>
              ) : contacts.length === 0 ? (
                <Text variant="caption" muted className="py-2 text-center">
                  Could not load names for these contacts yet.
                </Text>
              ) : (
                <View className="gap-3">
                  {contacts.map((contact) => (
                    <View key={contact.userId} className="flex-row items-center gap-3">
                      <Avatar name={contact.displayName} size="sm" />
                      <View className="flex-1">
                        <Text variant="body" numberOfLines={1} className="font-medium">
                          {contact.displayName}
                        </Text>
                        {contact.groupNames.length > 0 && (
                          <Text variant="caption" muted numberOfLines={1} className="mt-0.5">
                            {contact.groupNames.join(', ')}
                          </Text>
                        )}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
}
