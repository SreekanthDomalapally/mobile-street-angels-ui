import { ContactGroupsSheet, type ContactGroupAction } from '@/components/contacts/ContactGroupsSheet';
import { GroupContactList } from '@/components/contacts/GroupContactList';
import { EmergencyTypeSummary } from '@/components/groups/EmergencyTypeSummary';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useManagedGroups } from '@/hooks/useManagedGroups';
import { lookupUsersByEmail } from '@/services/api/users';
import { ApiError } from '@/services/api/client';
import type { CircleContact } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ContactPickerSheetProps {
  visible: boolean;
  preselectedGroupIds?: string[];
  onClose: () => void;
  onUpdated: () => void;
}

type PickerStep = 'choose-group' | 'add-people' | 'email';

export function ContactPickerSheet({
  visible,
  preselectedGroupIds = [],
  onClose,
  onUpdated,
}: ContactPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const managedGroups = useManagedGroups();
  const [step, setStep] = useState<PickerStep>(
    preselectedGroupIds.length === 1 ? 'add-people' : 'choose-group'
  );
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(
    preselectedGroupIds.length === 1 ? preselectedGroupIds[0] : null
  );
  const [manualEmail, setManualEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<CircleContact | null>(null);
  const [selectedAction, setSelectedAction] = useState<ContactGroupAction>('add-to-circle');
  const [showGroupsSheet, setShowGroupsSheet] = useState(false);

  const selectedGroup = useMemo(
    () => managedGroups.find((group) => group.id === selectedGroupId),
    [managedGroups, selectedGroupId]
  );

  const resetAndClose = () => {
    setStep(preselectedGroupIds.length === 1 ? 'add-people' : 'choose-group');
    setSelectedGroupId(preselectedGroupIds.length === 1 ? preselectedGroupIds[0] : null);
    setManualEmail('');
    setError(null);
    onClose();
  };

  const handleManualInvite = async () => {
    const email = manualEmail.trim().toLowerCase();
    if (!email || !email.includes('@')) {
      setError('Enter a valid email address.');
      return;
    }

    setError(null);
    try {
      const matches = await lookupUsersByEmail([email]);
      const match = matches[0];
      setSelectedContact({
        id: match?.user_id ?? `invite:${email}`,
        userId: match?.user_id,
        displayName: email,
        email,
        groupIds: [],
        onPlatform: Boolean(match),
        status: match ? 'member' : 'invited',
      });
      setSelectedAction(match ? 'add-to-circle' : 'invite-to-app');
      setShowGroupsSheet(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not look up that email.');
    }
  };

  const handleGroupsSaved = async () => {
    await queryClient.invalidateQueries({ queryKey: ['contacts'] });
    await queryClient.invalidateQueries({ queryKey: ['groups'] });
    await queryClient.invalidateQueries({ queryKey: ['group-invites'] });
    onUpdated();
    setShowGroupsSheet(false);
    setSelectedContact(null);
    resetAndClose();
  };

  if (!visible) return null;

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View
          className="flex-1 bg-charcoal-950"
          style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}
        >
          <View className="mb-4 flex-row items-center justify-between px-5">
            <View className="flex-1">
              <Text variant="title">Add contact</Text>
              {step === 'add-people' && selectedGroup ? (
                <Text variant="caption" muted className="mt-1">
                  Adding to {selectedGroup.name}
                </Text>
              ) : null}
            </View>
            <Pressable onPress={resetAndClose} accessibilityRole="button" accessibilityLabel="Close">
              <Text variant="body" className="text-responder-light">
                Close
              </Text>
            </Pressable>
          </View>

          {step === 'choose-group' ? (
            <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
              <Text variant="caption" muted className="mb-4">
                Pick a group first, then choose people from your phone contacts.
              </Text>
              {managedGroups.length === 0 ? (
                <Text variant="body" muted className="py-4 text-center">
                  Create a group on the Groups tab first.
                </Text>
              ) : (
                <View className="gap-2">
                  {managedGroups.map((group) => (
                    <Pressable
                      key={group.id}
                      onPress={() => {
                        setSelectedGroupId(group.id);
                        setStep('add-people');
                      }}
                      className="rounded-2xl border border-glass-border bg-charcoal-900 p-4 active:bg-charcoal-800"
                    >
                      <Text variant="body">{group.name}</Text>
                      <Text variant="caption" muted className="mt-1">
                        {group.memberCount} members
                      </Text>
                      <View className="mt-2">
                        <EmergencyTypeSummary types={group.emergencyTypes} maxVisible={4} />
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
              <Pressable onPress={() => setStep('email')} className="mt-6 py-2">
                <Text variant="caption" className="text-center text-responder-light">
                  Or add by email instead
                </Text>
              </Pressable>
            </ScrollView>
          ) : null}

          {step === 'add-people' && selectedGroupId ? (
            <View className="flex-1 px-5">
              {preselectedGroupIds.length !== 1 ? (
                <Pressable
                  onPress={() => {
                    setStep('choose-group');
                    setSelectedGroupId(null);
                  }}
                  className="mb-3 self-start py-1"
                >
                  <Text variant="caption" className="text-responder-light">
                    ← Change group
                  </Text>
                </Pressable>
              ) : null}
              <GroupContactList
                groupId={selectedGroupId}
                groupName={selectedGroup?.name}
                onUpdated={() => {
                  onUpdated();
                  resetAndClose();
                }}
              />
            </View>
          ) : null}

          {step === 'email' ? (
            <ScrollView className="flex-1 px-5" keyboardShouldPersistTaps="handled">
              <Pressable
                onPress={() => setStep('choose-group')}
                className="mb-4 self-start py-1"
              >
                <Text variant="caption" className="text-responder-light">
                  ← Back to groups
                </Text>
              </Pressable>
              <Text variant="caption" muted className="mb-4">
                Enter an email, then choose which groups to invite them to.
              </Text>
              <TextInput
                className="mb-3 min-h-[48px] rounded-2xl border border-glass-border bg-charcoal-900 px-4 text-base text-white"
                placeholder="name@example.com"
                placeholderTextColor="#6d6d75"
                autoCapitalize="none"
                keyboardType="email-address"
                value={manualEmail}
                onChangeText={setManualEmail}
              />
              <Button title="Continue with email" size="sm" onPress={handleManualInvite} />
              {error ? (
                <Text variant="caption" className="mt-3 text-emergency">
                  {error}
                </Text>
              ) : null}
            </ScrollView>
          ) : null}
        </View>
      </Modal>

      <ContactGroupsSheet
        visible={showGroupsSheet}
        contact={selectedContact}
        preselectedGroupIds={
          selectedGroupId ? [selectedGroupId] : preselectedGroupIds
        }
        action={selectedAction}
        onClose={() => {
          setShowGroupsSheet(false);
          setSelectedContact(null);
        }}
        onSaved={handleGroupsSaved}
      />
    </>
  );
}
