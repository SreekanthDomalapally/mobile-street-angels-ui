import { EmergencyTypeChipGrid } from '@/components/groups/EmergencyTypeChipGrid';
import { EmergencyTypeSummary } from '@/components/groups/EmergencyTypeSummary';
import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import { fallbackEmergencyTypes } from '@/hooks/useEmergencyCatalog';
import {
  useGroupEmergencyTypes,
  useSetGroupEmergencyTypes,
} from '@/hooks/useGroupEmergencyTypes';
import { useGroups } from '@/hooks/useGroups';
import { getEmergencyTypeLabel } from '@/lib/emergencyTypeLabels';
import {
  countCirclesForEmergencyType,
  formatEmergencyTypeCircleCount,
} from '@/lib/groupLabels';
import type { EmergencyType } from '@/types';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

export type AssignmentMode = 'all' | 'specific';

const ALL_TYPE_CODES = fallbackEmergencyTypes.map((t) => t.code as EmergencyType);

function typesToMode(types: EmergencyType[]): AssignmentMode {
  return types.length === 0 ? 'all' : 'specific';
}

function setsEqual(a: Set<EmergencyType>, b: Set<EmergencyType>): boolean {
  if (a.size !== b.size) return false;
  for (const code of a) {
    if (!b.has(code)) return false;
  }
  return true;
}

interface GroupEmergencyTypesSectionProps {
  groupId: string;
  canEdit: boolean;
  seedTypes?: EmergencyType[];
  onSaved?: () => void;
}

export function GroupEmergencyTypesSection({
  groupId,
  canEdit,
  seedTypes,
  onSaved,
}: GroupEmergencyTypesSectionProps) {
  const current = useGroupEmergencyTypes(groupId);
  const save = useSetGroupEmergencyTypes(groupId);
  const { data: groups } = useGroups();

  const serverTypes = useMemo(
    () => current.data ?? seedTypes ?? [],
    [current.data, seedTypes]
  );
  const serverMode = typesToMode(serverTypes);
  const serverSet = useMemo(() => new Set(serverTypes), [serverTypes]);

  const [userEdits, setUserEdits] = useState<{
    mode: AssignmentMode;
    selected: Set<EmergencyType>;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mode = userEdits?.mode ?? serverMode;
  const selected = userEdits?.selected ?? serverSet;

  const dirty =
    userEdits !== null &&
    (mode !== serverMode || !setsEqual(selected, serverSet));

  const applyEdits = (next: { mode: AssignmentMode; selected: Set<EmergencyType> }) => {
    setUserEdits(next);
    setError(null);
  };

  const setAllMode = () => {
    Haptics.selectionAsync();
    applyEdits({ mode: 'all', selected: new Set() });
  };

  const setSpecificMode = () => {
    Haptics.selectionAsync();
    applyEdits({
      mode: 'specific',
      selected: selected.size > 0 ? new Set(selected) : new Set(ALL_TYPE_CODES),
    });
  };

  const toggleType = (code: EmergencyType) => {
    const base = userEdits?.selected ?? new Set(serverSet);
    const next = new Set(base);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    applyEdits({ mode: 'specific', selected: next });
  };

  const handleSave = async () => {
    if (mode === 'specific' && selected.size === 0) {
      setError('Select at least one emergency type, or switch to All emergencies.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    const payload = mode === 'all' ? [] : Array.from(selected);
    setError(null);

    try {
      await save.mutateAsync(payload);
      setUserEdits(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaved?.();
    } catch (err) {
      console.warn('[group-emergency-types] save failed:', err);
      setError('Could not save. Check your connection and try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  if (current.isLoading && current.data === undefined && seedTypes === undefined) {
    return (
      <View className="mb-6 items-center rounded-2xl border border-glass-border bg-charcoal-900 py-8">
        <ActivityIndicator color="#6bb892" />
      </View>
    );
  }

  if (!canEdit) {
    return (
      <View className="mb-6 rounded-2xl border border-glass-border bg-charcoal-900 p-4">
        <Text variant="label" className="mb-2">
          Responds to
        </Text>
        <EmergencyTypeSummary types={serverTypes} size="md" />
      </View>
    );
  }

  return (
    <View className="mb-6 rounded-2xl border border-glass-border bg-charcoal-900 p-4">
      <Text variant="label" className="mb-1">
        Emergency types
      </Text>
      <Text variant="caption" muted className="mb-4">
        When you send an SOS, groups that handle that type are notified.
      </Text>

      <View className="mb-4 flex-row gap-2">
        <Pressable
          onPress={setAllMode}
          className={`flex-1 items-center rounded-2xl border px-3 py-3 ${
            mode === 'all'
              ? 'border-responder/60 bg-responder/15'
              : 'border-glass-border bg-charcoal-800'
          }`}
          accessibilityRole="radio"
          accessibilityState={{ selected: mode === 'all' }}
        >
          <Text variant="body" className={mode === 'all' ? 'text-responder-light' : ''}>
            All emergencies
          </Text>
        </Pressable>
        <Pressable
          onPress={setSpecificMode}
          className={`flex-1 items-center rounded-2xl border px-3 py-3 ${
            mode === 'specific'
              ? 'border-responder/60 bg-responder/15'
              : 'border-glass-border bg-charcoal-800'
          }`}
          accessibilityRole="radio"
          accessibilityState={{ selected: mode === 'specific' }}
        >
          <Text variant="body" className={mode === 'specific' ? 'text-responder-light' : ''}>
            Pick types
          </Text>
        </Pressable>
      </View>

      {mode === 'specific' ? (
        <>
          <Text variant="caption" muted className="mb-3">
            Tap types this group should respond to.
          </Text>
          <EmergencyTypeChipGrid
            selected={selected}
            onToggle={toggleType}
            disabled={save.isPending}
          />
          <View className="mt-3 gap-1">
            {ALL_TYPE_CODES.filter((code) => selected.has(code)).map((code) => {
              const circleCount = countCirclesForEmergencyType(groups, code, {
                groupId,
                types: Array.from(selected),
              });
              return (
                <Text key={code} variant="caption" muted>
                  {formatEmergencyTypeCircleCount(circleCount)} will respond to{' '}
                  {getEmergencyTypeLabel(code)}
                </Text>
              );
            })}
          </View>
        </>
      ) : (
        <View className="rounded-2xl border border-glass-border bg-charcoal-800 px-4 py-3">
          <EmergencyTypeSummary types={[]} size="md" />
          <Text variant="caption" muted className="mt-2">
            This group is alerted for every SOS type you send.
          </Text>
        </View>
      )}

      {error ? (
        <Text variant="caption" className="mt-3 text-emergency">
          {error}
        </Text>
      ) : null}

      {dirty ? (
        <Button
          title="Save emergency types"
          size="sm"
          className="mt-4"
          loading={save.isPending}
          onPress={() => void handleSave()}
        />
      ) : (
        <View className="mt-4">
          <EmergencyTypeSummary types={serverTypes} maxVisible={6} size="md" />
        </View>
      )}
    </View>
  );
}

export function CreateGroupEmergencyTypesPicker({
  mode,
  onModeChange,
  selected,
  onSelectedChange,
  onToggle,
}: {
  mode: AssignmentMode;
  onModeChange: (mode: AssignmentMode) => void;
  selected: Set<EmergencyType>;
  onSelectedChange: (types: EmergencyType[]) => void;
  onToggle: (code: EmergencyType) => void;
}) {
  return (
    <View className="mb-4">
      <Text variant="label" className="mb-2">
        Which emergencies?
      </Text>
      <View className="mb-3 flex-row gap-2">
        <Pressable
          onPress={() => onModeChange('all')}
          className={`flex-1 items-center rounded-2xl border px-3 py-2.5 ${
            mode === 'all'
              ? 'border-responder/60 bg-responder/15'
              : 'border-glass-border bg-charcoal-800'
          }`}
        >
          <Text variant="caption" className={mode === 'all' ? 'text-responder-light' : ''}>
            All types
          </Text>
        </Pressable>
        <Pressable
          onPress={() => {
            onModeChange('specific');
            if (selected.size === 0) {
              onSelectedChange(ALL_TYPE_CODES);
            }
          }}
          className={`flex-1 items-center rounded-2xl border px-3 py-2.5 ${
            mode === 'specific'
              ? 'border-responder/60 bg-responder/15'
              : 'border-glass-border bg-charcoal-800'
          }`}
        >
          <Text variant="caption" className={mode === 'specific' ? 'text-responder-light' : ''}>
            Pick types
          </Text>
        </Pressable>
      </View>
      {mode === 'specific' ? (
        <EmergencyTypeChipGrid selected={selected} onToggle={onToggle} />
      ) : (
        <Text variant="caption" muted>
          You can change this anytime on the Groups tab.
        </Text>
      )}
    </View>
  );
}
