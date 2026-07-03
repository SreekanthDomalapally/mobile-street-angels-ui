import { EmergencyTypeChipGrid } from '@/components/groups/EmergencyTypeChipGrid';
import { EmergencyTypeSummary } from '@/components/groups/EmergencyTypeSummary';
import { Text } from '@/components/ui/Text';
import { fallbackEmergencyTypes } from '@/hooks/useEmergencyCatalog';
import {
  useGroupEmergencyTypes,
  useSetGroupEmergencyTypes,
} from '@/hooks/useGroupEmergencyTypes';
import {
  EMERGENCY_PRESETS,
  presetFromTypes,
  typesForPreset,
  type EmergencyPresetId,
} from '@/lib/groupEmergencyPresets';
import type { EmergencyType } from '@/types';
import * as Haptics from 'expo-haptics';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

const ALL_TYPE_CODES = fallbackEmergencyTypes.map((t) => t.code as EmergencyType);

interface GroupEmergencyTypesSectionProps {
  groupId: string;
  canEdit: boolean;
  seedTypes?: EmergencyType[];
  onSaved?: () => void;
  /** Compact layout for group settings area */
  compact?: boolean;
}

export function GroupEmergencyTypesSection({
  groupId,
  canEdit,
  seedTypes,
  onSaved,
  compact = false,
}: GroupEmergencyTypesSectionProps) {
  const current = useGroupEmergencyTypes(groupId);
  const save = useSetGroupEmergencyTypes(groupId);

  const serverTypes = useMemo(
    () => current.data ?? seedTypes ?? [],
    [current.data, seedTypes]
  );
  const serverPreset = presetFromTypes(serverTypes);

  const [activePreset, setActivePreset] = useState<EmergencyPresetId | null>(null);
  const [customSelection, setCustomSelection] = useState<Set<EmergencyType> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const preset = activePreset ?? serverPreset;
  const customSet =
    customSelection ??
    (serverPreset === 'custom' ? new Set(serverTypes) : new Set(ALL_TYPE_CODES));

  const persist = async (presetId: EmergencyPresetId, custom: Set<EmergencyType>) => {
    const payload = typesForPreset(presetId, custom);
    if (presetId === 'custom' && payload.length === 0) {
      setError('Select at least one type.');
      return;
    }
    setError(null);
    try {
      await save.mutateAsync(payload);
      setActivePreset(null);
      setCustomSelection(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onSaved?.();
    } catch {
      setError('Could not save. Try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const selectPreset = (presetId: EmergencyPresetId) => {
    Haptics.selectionAsync();
    if (presetId === 'custom') {
      const next =
        preset === 'custom'
          ? customSet
          : serverPreset === 'custom'
            ? new Set(serverTypes)
            : new Set(ALL_TYPE_CODES);
      setActivePreset('custom');
      setCustomSelection(next);
      return;
    }
    setActivePreset(presetId);
    setCustomSelection(null);
    void persist(presetId, customSet);
  };

  const toggleCustomType = (code: EmergencyType) => {
    const base = customSelection ?? customSet;
    const next = new Set(base);
    if (next.has(code)) next.delete(code);
    else next.add(code);
    setActivePreset('custom');
    setCustomSelection(next);
    void persist('custom', next);
  };

  if (current.isLoading && current.data === undefined && seedTypes === undefined) {
    return (
      <View className="mb-4 items-center rounded-2xl border border-glass-border bg-charcoal-900 py-6">
        <ActivityIndicator color="#6bb892" />
      </View>
    );
  }

  if (!canEdit) {
    return (
      <View className="mb-4 rounded-2xl border border-glass-border bg-charcoal-900 p-4">
        <Text variant="label" className="mb-2">
          Alert settings
        </Text>
        <EmergencyTypeSummary types={serverTypes} size="md" />
      </View>
    );
  }

  return (
    <View className={`mb-4 rounded-2xl border border-glass-border bg-charcoal-900 ${compact ? 'p-3' : 'p-4'}`}>
      <Text variant="label" className="mb-1">
        Which SOS alerts notify this group?
      </Text>
      {!compact ? (
        <Text variant="caption" muted className="mb-3">
          Most groups use &quot;All SOS alerts&quot;. Change anytime.
        </Text>
      ) : null}

      <View className="gap-2">
        {EMERGENCY_PRESETS.filter((p) => p.id !== 'custom').map((item) => {
          const selected = preset === item.id;
          return (
            <Pressable
              key={item.id}
              onPress={() => selectPreset(item.id)}
              disabled={save.isPending}
              className={`flex-row items-center gap-3 rounded-2xl border px-4 py-3 ${
                selected
                  ? 'border-responder/60 bg-responder/15'
                  : 'border-glass-border bg-charcoal-800'
              } ${save.isPending ? 'opacity-60' : ''}`}
            >
              <View className="flex-1">
                <Text variant="body" className={selected ? 'text-responder-light' : ''}>
                  {item.label}
                </Text>
                <Text variant="caption" muted className="mt-0.5">
                  {item.subtitle}
                </Text>
              </View>
              {selected ? (
                <View className="h-5 w-5 items-center justify-center rounded-full bg-responder">
                  <Text variant="caption" className="text-white">
                    ✓
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}

        <Pressable
          onPress={() => selectPreset('custom')}
          disabled={save.isPending}
          className={`rounded-2xl border px-4 py-3 ${
            preset === 'custom'
              ? 'border-responder/60 bg-responder/15'
              : 'border-glass-border bg-charcoal-800'
          }`}
        >
          <Text variant="body" className={preset === 'custom' ? 'text-responder-light' : ''}>
            Choose types
          </Text>
          <Text variant="caption" muted className="mt-0.5">
            Pick exactly which alerts this group gets
          </Text>
        </Pressable>
      </View>

      {preset === 'custom' ? (
        <View className="mt-3">
          <EmergencyTypeChipGrid
            selected={customSet}
            onToggle={toggleCustomType}
            disabled={save.isPending}
          />
        </View>
      ) : null}

      {error ? (
        <Text variant="caption" className="mt-2 text-emergency">
          {error}
        </Text>
      ) : null}

      {save.isPending ? (
        <Text variant="caption" muted className="mt-2">
          Saving…
        </Text>
      ) : null}
    </View>
  );
}
