import { AppLogo } from '@/components/ui/AppLogo';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { useCreateGroup, useGroups } from '@/hooks/useGroups';
import { hasOwnedGroupNamed } from '@/lib/groupLabels';
import { markGroupCreated } from '@/services/onboardingState';
import { ApiError } from '@/services/api/client';
import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const GROUP_TYPES = [
  { id: 'family', label: 'Family' },
  { id: 'friends', label: 'Friends' },
  { id: 'work', label: 'Work' },
  { id: 'emergency', label: 'Emergency Contacts' },
  { id: 'travel', label: 'Travel Group' },
  { id: 'night_out', label: 'Night Out' },
  { id: 'custom', label: 'Custom' },
] as const;

export default function CreateFirstGroupScreen() {
  const insets = useSafeAreaInsets();
  const createGroup = useCreateGroup();
  const { data: groups } = useGroups();
  const [name, setName] = useState('Family');
  const [type, setType] = useState<string>('family');
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Enter a group name with at least 2 characters.');
      return;
    }

    if (hasOwnedGroupNamed(groups, trimmed)) {
      setError(`You already have a circle named "${trimmed}". Open Groups to add people.`);
      return;
    }

    setError(null);
    try {
      await createGroup.mutateAsync({ name: trimmed, description: type });
      await markGroupCreated();
      router.replace('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create group.');
    }
  };

  return (
    <ScrollView
      className="flex-1 bg-charcoal-950"
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 24,
        paddingHorizontal: 24,
      }}>
      <View className="mb-6 items-center">
        <AppLogo size="md" />
      </View>

      <Text variant="hero" className="mb-2">
        Create your first safety group
      </Text>
      <Text variant="body" muted className="mb-6">
        Circles are private groups. Your niece can have her own Family circle too — SOS only
        alerts the circle you choose.
      </Text>

      <Text variant="label" className="mb-3">
        Group type
      </Text>
      <View className="mb-6 flex-row flex-wrap gap-2">
        {GROUP_TYPES.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => {
              setType(item.id);
              if (item.id !== 'custom') {
                setName(item.label);
              }
            }}
            className={`rounded-full border px-4 py-2 ${
              type === item.id
                ? 'border-responder bg-responder/20'
                : 'border-glass-border bg-charcoal-900'
            }`}>
            <Text variant="caption">{item.label}</Text>
          </Pressable>
        ))}
      </View>

      <Text variant="label" className="mb-2">
        Group name
      </Text>
      <TextInput
        className="mb-4 min-h-[52px] rounded-2xl border border-glass-border bg-charcoal-900 px-4 text-base text-white"
        value={name}
        onChangeText={setName}
        placeholder="Group name"
        placeholderTextColor="#6d6d75"
      />

      {error && (
        <Text variant="caption" className="mb-4 text-emergency">
          {error}
        </Text>
      )}

      <Button title="Create group" loading={createGroup.isPending} onPress={handleCreate} />
    </ScrollView>
  );
}
