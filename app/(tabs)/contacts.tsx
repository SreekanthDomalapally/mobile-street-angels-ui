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
import { FlatList, Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ContactsScreen() {
  const insets = useSafeAreaInsets();
  const { data: contacts, isLoading, isError, refetch } = useCircleContacts();
  const { data: groups } = useGroups();
  const [search, setSearch] = useState('');
  const [filterGroupId, setFilterGroupId] = useState<string | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedContact, setSelectedContact] = useState<CircleContact | null>(null);

  const filtered = useMemo(() => {
    let list = contacts ?? [];
    if (filterGroupId) {
      list = list.filter((contact) => contact.groupIds.includes(filterGroupId));
    }
    const query = search.trim().toLowerCase();
    if (!query) return list;
    return list.filter(
      (contact) =>
        contact.displayName.toLowerCase().includes(query) ||
        contact.email?.toLowerCase().includes(query) ||
        contact.phone?.includes(query)
    );
  }, [contacts, search, filterGroupId]);

  if (isLoading) return <LoadingState message="Loading contacts…" />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  return (
    <View className="flex-1 bg-charcoal-950">
      <FlatList
        data={filtered}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 20,
          flexGrow: 1,
        }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            <View className="mb-6 flex-row items-center justify-between gap-3">
              <Text variant="title">Contacts</Text>
              <Button title="+ Add" size="sm" onPress={() => setShowPicker(true)} />
            </View>

            <Text variant="body" muted className="mb-4">
              People in your groups. Tap a contact to move them between groups.
            </Text>

            <TrustedContactsPanel />

            {(groups?.length ?? 0) > 0 ? (
              <View className="mb-4">
                <Text variant="label" className="mb-2">
                  Filter by group
                </Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: 8 }}
                >
                  <Pressable
                    onPress={() => setFilterGroupId(null)}
                    className={`rounded-full px-4 py-2 ${
                      filterGroupId === null
                        ? 'bg-responder/20'
                        : 'border border-glass-border bg-charcoal-900'
                    }`}
                  >
                    <Text
                      variant="caption"
                      className={filterGroupId === null ? 'text-responder-light' : ''}
                    >
                      All
                    </Text>
                  </Pressable>
                  {(groups ?? []).map((group) => {
                    const active = filterGroupId === group.id;
                    return (
                      <Pressable
                        key={group.id}
                        onPress={() => setFilterGroupId(active ? null : group.id)}
                        className={`rounded-full px-4 py-2 ${
                          active
                            ? 'bg-responder/20'
                            : 'border border-glass-border bg-charcoal-900'
                        }`}
                      >
                        <Text variant="caption" className={active ? 'text-responder-light' : ''}>
                          {group.name}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            ) : null}

            <TextInput
              className="mb-4 min-h-[48px] rounded-2xl border border-glass-border bg-charcoal-900 px-4 text-base text-white"
              placeholder="Search contacts"
              placeholderTextColor="#6d6d75"
              value={search}
              onChangeText={setSearch}
            />
          </>
        }
        ListEmptyComponent={
          <EmptyState
            icon="book-outline"
            title={filterGroupId ? 'No contacts in this group' : 'No contacts yet'}
            description={
              filterGroupId
                ? 'Add people from your phone contacts on the Groups tab, or tap + Add here.'
                : 'Add family and friends to your groups so they can respond when you send an SOS.'
            }
            action={<Button title="Add contact" onPress={() => setShowPicker(true)} />}
          />
        }
        renderItem={({ item: contact }) => (
          <CircleContactCard
            contact={contact}
            groups={groups ?? []}
            onPress={() => setSelectedContact(contact)}
          />
        )}
      />

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
