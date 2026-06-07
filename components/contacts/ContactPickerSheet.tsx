import { ContactGroupsSheet, type ContactGroupAction } from '@/components/contacts/ContactGroupsSheet';
import { GroupContactList } from '@/components/contacts/GroupContactList';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { lookupUsersByEmail } from '@/services/api/users';
import { ApiError } from '@/services/api/client';
import type { CircleContact } from '@/types';
import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Modal, Pressable, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ContactPickerSheetProps {
  visible: boolean;
  preselectedGroupIds?: string[];
  onClose: () => void;
  onUpdated: () => void;
}

export function ContactPickerSheet({
  visible,
  preselectedGroupIds = [],
  onClose,
  onUpdated,
}: ContactPickerSheetProps) {
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [manualEmail, setManualEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [selectedContact, setSelectedContact] = useState<CircleContact | null>(null);
  const [selectedAction, setSelectedAction] = useState<ContactGroupAction>('add-to-circle');
  const [showGroupsSheet, setShowGroupsSheet] = useState(false);

  const singleGroupId = preselectedGroupIds.length === 1 ? preselectedGroupIds[0] : undefined;

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
  };

  if (!visible) return null;

  return (
    <>
      <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
        <View
          className="flex-1 bg-charcoal-950"
          style={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }}>
          <View className="mb-4 flex-row items-center justify-between px-5">
            <Text variant="title">Add contact</Text>
            <Pressable onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
              <Text variant="body" className="text-responder-light">
                Close
              </Text>
            </Pressable>
          </View>

          {singleGroupId ? (
            <View className="flex-1 px-5">
              <GroupContactList
                groupId={singleGroupId}
                onUpdated={() => {
                  onUpdated();
                  onClose();
                }}
              />
            </View>
          ) : (
            <View className="flex-1 px-5">
              <Text variant="caption" muted className="mb-4">
                Choose a group first, or add by email below.
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
              {error && (
                <Text variant="caption" className="mt-3 text-emergency">
                  {error}
                </Text>
              )}
            </View>
          )}
        </View>
      </Modal>

      <ContactGroupsSheet
        visible={showGroupsSheet}
        contact={selectedContact}
        preselectedGroupIds={preselectedGroupIds}
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
