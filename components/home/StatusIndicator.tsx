import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { APP_CAPTION } from '@/constants/branding';
import { Text } from '@/components/ui/Text';
import { useSOSStore } from '@/stores/sosStore';

export function StatusIndicator() {
  const { status, isOffline } = useSOSStore();

  if (status === 'idle') {
    return (
      <View
        className="flex-row items-center gap-2 rounded-full bg-charcoal-800 px-4 py-2"
        accessibilityLabel={isOffline ? 'Offline mode' : `Ready — ${APP_CAPTION}`}>
        <View className={`h-2 w-2 rounded-full ${isOffline ? 'bg-warning' : 'bg-responder'}`} />
        <Text variant="caption">
          {isOffline ? 'Offline — alerts will queue' : `Ready · ${APP_CAPTION}`}
        </Text>
      </View>
    );
  }

  return (
    <View className="flex-row items-center gap-2 rounded-full bg-emergency/20 px-4 py-2">
      <Ionicons name="radio-outline" size={14} color="#e85d5d" />
      <Text variant="caption" className="text-emergency-glow">
        Alert active
      </Text>
    </View>
  );
}
