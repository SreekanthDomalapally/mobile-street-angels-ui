import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useDeviceContactRows, type DeviceContactRow } from '@/hooks/useDeviceContactRows';
import { useCreateGroup } from '@/hooks/useGroups';
import { GROUP_NAME_SUGGESTIONS } from '@/lib/groupEmergencyPresets';
import { ApiError } from '@/services/api/client';
import { inviteContactToGroup } from '@/services/groupContactActions';
import { useAuthStore } from '@/stores/authStore';
import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface CreateGroupWizardProps {
  visible: boolean;
  existingGroupNames: { name: string; myRole?: string }[];
  onClose: () => void;
  onCreated: (groupId: string) => void;
}

type WizardStep = 'contacts' | 'name';

function canAddContact(row: DeviceContactRow): boolean {
  return Boolean(row.userId || row.inviteEmail || row.canReach);
}

export function CreateGroupWizard({
  visible,
  existingGroupNames,
  onClose,
  onCreated,
}: CreateGroupWizardProps) {
  const insets = useSafeAreaInsets();
  const createGroup = useCreateGroup();
  const { rows, loading } = useDeviceContactRows(visible);
  const inviterName = useAuthStore((s) => s.user?.displayName ?? 'A friend');

  const [step, setStep] = useState<WizardStep>('contacts');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const reset = () => {
    setStep('contacts');
    setSearch('');
    setSelectedIds(new Set());
    setGroupName('');
    setError(null);
    setCreating(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    const addable = rows.filter(canAddContact);
    if (!query) return addable;
    return addable.filter(
      (row) =>
        row.name.toLowerCase().includes(query) ||
        row.emails.some((e) => e.toLowerCase().includes(query)) ||
        row.phoneNumbers.some((p) => p.includes(query))
    );
  }, [rows, search]);

  const selectedRows = useMemo(
    () => rows.filter((row) => selectedIds.has(row.id)),
    [rows, selectedIds]
  );

  const toggleContact = (row: DeviceContactRow) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(row.id)) next.delete(row.id);
      else next.add(row.id);
      return next;
    });
  };

  const handleCreate = async () => {
    const trimmed = groupName.trim();
    if (trimmed.length < 2) {
      setError('Enter a group name (at least 2 characters).');
      return;
    }
    if (
      existingGroupNames.some(
        (g) => g.myRole === 'owner' && g.name.trim().toLowerCase() === trimmed.toLowerCase()
      )
    ) {
      setError(`You already have a group named "${trimmed}".`);
      return;
    }

    setCreating(true);
    setError(null);
    try {
      const group = await createGroup.mutateAsync({ name: trimmed });
      for (const row of selectedRows) {
        try {
          await inviteContactToGroup(
            {
              displayName: row.name,
              email: row.inviteEmail ?? row.primaryEmail,
              phone: row.phoneNumbers[0],
              userId: row.userId,
            },
            group.id,
            { inviterName, groupName: trimmed }
          );
        } catch {
          // Continue inviting others even if one fails.
        }
      }
      handleClose();
      onCreated(group.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create group.');
      setCreating(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View
        className="flex-1 bg-charcoal-950"
        style={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 8 }}
      >
        <View className="mb-4 flex-row items-center justify-between px-5">
          {step === 'name' ? (
            <Pressable
              onPress={() => setStep('contacts')}
              accessibilityRole="button"
              accessibilityLabel="Back to contacts"
              className="mr-2 h-10 w-10 items-center justify-center rounded-xl bg-charcoal-800"
            >
              <Ionicons name="chevron-back" size={22} color="#a0a0a8" />
            </Pressable>
          ) : (
            <View className="w-10" />
          )}
          <Text variant="title" className="flex-1 text-center">
            {step === 'contacts' ? 'Add group members' : 'Name your group'}
          </Text>
          <Pressable onPress={handleClose} accessibilityRole="button" accessibilityLabel="Close">
            <Text variant="body" className="text-responder-light">
              Cancel
            </Text>
          </Pressable>
        </View>

        {step === 'contacts' ? (
          <>
            <Text variant="caption" muted className="mb-3 px-5">
              Select people from your phone — like WhatsApp. You can add more later.
            </Text>
            <View className="px-5">
              <TextInput
                className="mb-4 min-h-[48px] rounded-2xl border border-glass-border bg-charcoal-900 px-4 text-base text-white"
                placeholder="Search name or number"
                placeholderTextColor="#6d6d75"
                value={search}
                onChangeText={setSearch}
              />
            </View>

            {loading ? (
              <View className="flex-1 items-center justify-center">
                <ActivityIndicator color="#6bb892" />
              </View>
            ) : (
              <FlatList
                data={filtered}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
                keyboardShouldPersistTaps="handled"
                ListEmptyComponent={
                  <Text variant="body" muted className="py-8 text-center">
                    No contacts found. Allow contacts access in Settings.
                  </Text>
                }
                renderItem={({ item: row }) => {
                  const selected = selectedIds.has(row.id);
                  return (
                    <Pressable
                      onPress={() => toggleContact(row)}
                      className="flex-row items-center gap-3 border-b border-glass-border py-3"
                    >
                      <View className="h-11 w-11 items-center justify-center rounded-full bg-charcoal-800">
                        <Text variant="label" className="text-responder-light">
                          {row.name.slice(0, 2).toUpperCase()}
                        </Text>
                      </View>
                      <View className="min-w-0 flex-1">
                        <Text variant="body" numberOfLines={1}>
                          {row.name}
                        </Text>
                        <Text variant="caption" muted numberOfLines={1}>
                          {row.onPlatform ? 'On YouHoo Alert' : 'Invite to install'}
                        </Text>
                      </View>
                      <View
                        className={`h-6 w-6 items-center justify-center rounded-full border ${
                          selected ? 'border-responder bg-responder' : 'border-charcoal-500'
                        }`}
                      >
                        {selected ? (
                          <Ionicons name="checkmark" size={16} color="#fff" />
                        ) : null}
                      </View>
                    </Pressable>
                  );
                }}
              />
            )}

            <View
              className="absolute bottom-0 left-0 right-0 border-t border-glass-border bg-charcoal-950 px-5 pt-4"
              style={{ paddingBottom: insets.bottom + 12 }}
            >
              <Button
                title={
                  selectedIds.size > 0
                    ? `Next · ${selectedIds.size} selected`
                    : 'Next · skip for now'
                }
                onPress={() => {
                  setError(null);
                  setStep('name');
                }}
              />
            </View>
          </>
        ) : (
          <View className="flex-1 px-5">
            <Text variant="caption" muted className="mb-4">
              {selectedIds.size > 0
                ? `${selectedIds.size} people will be invited when you create the group.`
                : 'You can add people from the group screen after creating it.'}
            </Text>

            <TextInput
              className="mb-4 min-h-[52px] rounded-2xl border border-glass-border bg-charcoal-900 px-4 text-base text-white"
              placeholder="Group name"
              placeholderTextColor="#6d6d75"
              value={groupName}
              onChangeText={(text) => {
                setGroupName(text);
                if (error) setError(null);
              }}
              autoFocus
            />

            <Text variant="label" className="mb-2">
              Suggestions
            </Text>
            <View className="mb-6 flex-row flex-wrap gap-2">
              {GROUP_NAME_SUGGESTIONS.map((suggestion) => (
                <Pressable
                  key={suggestion}
                  onPress={() => setGroupName(suggestion)}
                  className={`rounded-full px-4 py-2 ${
                    groupName === suggestion
                      ? 'bg-responder/20'
                      : 'border border-glass-border bg-charcoal-900'
                  }`}
                >
                  <Text
                    variant="caption"
                    className={groupName === suggestion ? 'text-responder-light' : ''}
                  >
                    {suggestion}
                  </Text>
                </Pressable>
              ))}
            </View>

            {error ? (
              <Text variant="caption" className="mb-4 text-emergency">
                {error}
              </Text>
            ) : null}

            <Button
              title="Create group"
              loading={creating || createGroup.isPending}
              onPress={() => void handleCreate()}
            />
          </View>
        )}
      </View>
    </Modal>
  );
}
