import { EmptyState } from '@/components/common/EmptyState';
import { ErrorState } from '@/components/common/ErrorState';
import { LoadingState } from '@/components/common/LoadingState';
import { CircleContactCard } from '@/components/contacts/CircleContactCard';
import { TrustedContactsPanel } from '@/components/trusted/TrustedContactsPanel';
import { ContactGroupsSheet } from '@/components/contacts/ContactGroupsSheet';
import { ContactPickerSheet } from '@/components/contacts/ContactPickerSheet';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useCircleContacts } from '@/hooks/useCircleContacts';
import { useGroups } from '@/hooks/useGroups';
import type { CircleContact } from '@/types';
import { useMemo, useState } from 'react';
import { ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ContactsScreen() {
  const insets = useSafeAreaInsets();
  const { data: contacts, isLoading, isError, refetch } = useCircleContacts();
  const { data: groups } = useGroups();
  const [search, setSearch] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CircleContact | null>(null);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return contacts ?? [];
    return (contacts ?? []).filter(
      (contact) =>
        contact.displayName.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.phone?.includes(query)
    );
  }, [contacts, search]);

  if (isLoading) return <LoadingState message="Loading contacts…" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <View className="flex-1 bg-charcoal-950">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 20,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View className="mb-6 flex-row items-center justify-between gap-3">
          <Text variant="title">Contacts</Text>
          <Button title="+ Add" size="sm" onPress={() => setShowPicker(true)} />
        </View>

        <Text variant="body" muted className="mb-4">
          Trusted contacts and people in your safety groups.
        </Text>

        <TrustedContactsPanel />

        <TextInput
          className="mb-4 min-h-[48px] rounded-2xl border border-glass-border bg-charcoal-900 px-4 text-base text-white"
          placeholder="Search contacts"
          placeholderTextColor="#6d6d75"
          value={search}
          onChangeText={setSearch}
        />

        {filtered.length === 0 ? (
          <EmptyState
            icon="book-outline"
            title="No contacts yet"
            description="Add family and friends to your groups so they can respond when you send an SOS."
            action={<Button title="Add contact" onPress={() => setShowPicker(true)} />}
          />
        ) : (
          filtered.map((contact) => (
            <CircleContactCard
              key={contact.id}
              contact={contact}
              groups={groups ?? []}
              onPress={() => setSelectedContact(contact)}
            />
          ))
        )}
      </ScrollView>

      <ContactPickerSheet
        visible={showPicker}
        onClose={() => setShowPicker(false)}
        onUpdated={() => refetch()}
      />

      <ContactGroupsSheet
        visible={selectedContact !== null}
        contact={selectedContact}
        onClose={() => setSelectedContact(null)}
        onSaved={() => refetch()}
      />
    </View>
  );
}
