import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Text } from '@/components/ui/Text';
import { useSOSStore } from '@/stores/sosStore';

export function StatusIndicator() {
  const { status, isOffline, activeAlert } = useSOSStore();

  const isLive =
    Boolean(activeAlert) && (status === 'active' || status === 'responding');

  if (!isLive) {
    return (
      <View
        className="flex-row items-center gap-2 rounded-2xl border border-glass-border bg-charcoal-900/90 px-3 py-2"
        accessibilityLabel={isOffline ? 'Offline mode' : 'Protected and ready'}>
        <View
          className={`h-2 w-2 rounded-full ${isOffline ? 'bg-warning' : 'bg-responder'}`}
        />
        <Text variant="caption" className="text-xs">
          {isOffline ? 'Offline' : 'Protected'}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-2 rounded-2xl border border-emergency/30 bg-emergency/15 px-3 py-2">
      <Ionicons name="radio" size={14} color="#e85d5d" />
      <Text variant="caption" className="font-semibold text-emergency-glow">
        Live
      </Text>
    </View>
  );
}
