import { Linking, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';
import { GlassCard } from '@/components/ui/GlassCard';
import { Text } from '@/components/ui/Text';
import { mockActiveAlert } from '@/data/mock';

export default function AlertResponseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const alert = mockActiveAlert;

  const callUser = () => Linking.openURL('tel:+15550100');
  const navigate = () =>
    Linking.openURL(
      `https://maps.google.com/?q=${alert.location.latitude},${alert.location.longitude}`
    );

  return (
    <View
      className="flex-1 bg-charcoal-950 px-5"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
      <View className="mb-6 flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-emergency/20">
          <Ionicons name="alert-circle" size={28} color="#e85d5d" />
        </View>
        <View>
          <Text variant="title">Respond to alert</Text>
          <Text variant="caption" muted>
            Someone needs help nearby
          </Text>
        </View>
      </View>

      <GlassCard className="mb-6">
        <Text variant="label" className="mb-2">
          Alert details
        </Text>
        <Text variant="body">{alert.message ?? 'Emergency assistance requested'}</Text>
        <Text variant="caption" muted className="mt-2">
          Type: {alert.type} · ID: {id ?? alert.id}
        </Text>
      </GlassCard>

      <View className="gap-3">
        <Button title="Accept & respond" variant="emergency" size="lg" onPress={() => {}} />
        <Button title="Share ETA (4 min)" variant="primary" onPress={() => {}} />
        <Button
          title="Call person in need"
          variant="secondary"
          icon={<Ionicons name="call" size={20} color="#fff" style={{ marginRight: 8 }} />}
          onPress={callUser}
        />
        <Button
          title="Open navigation"
          variant="secondary"
          icon={
            <Ionicons name="navigate" size={20} color="#fff" style={{ marginRight: 8 }} />
          }
          onPress={navigate}
        />
      </View>

      <Text variant="label" className="mb-3 mt-8">
        Update status
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {(['viewing', 'en_route', 'arrived'] as const).map((status) => (
          <Button
            key={status}
            title={status.replace('_', ' ')}
            variant="secondary"
            size="sm"
            onPress={() => {}}
          />
        ))}
      </View>
    </View>
  );
}
