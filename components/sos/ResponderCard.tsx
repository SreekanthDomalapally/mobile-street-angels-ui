import { Linking, Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Avatar } from '@/components/ui/Avatar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Text } from '@/components/ui/Text';
import { formatEta, getResponderStatusLabel } from '@/lib/utils';
import type { Responder } from '@/types';

interface ResponderCardProps {
  responder: Responder;
  compact?: boolean;
}

export function ResponderCard({ responder, compact }: ResponderCardProps) {
  const call = () => {
    if (responder.phone) Linking.openURL(`tel:${responder.phone}`);
  };

  return (
    <GlassCard className={compact ? 'mb-2' : 'mb-3'}>
      <View className="flex-row items-center gap-3">
        <Avatar name={responder.name} size={compact ? 'sm' : 'md'} />
        <View className="flex-1">
          <Text variant="subtitle">{responder.name}</Text>
          <Text variant="caption" className="text-responder-light">
            {getResponderStatusLabel(responder.status)}
            {responder.etaMinutes != null && ` · ${formatEta(responder.etaMinutes)}`}
          </Text>
        </View>
        {responder.phone && (
          <Pressable
            onPress={call}
            className="h-12 w-12 items-center justify-center rounded-full bg-responder/20"
            accessibilityRole="button"
            accessibilityLabel={`Call ${responder.name}`}>
            <Ionicons name="call" size={22} color="#6bb892" />
          </Pressable>
        )}
      </View>
    </GlassCard>
  );
}
