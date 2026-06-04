import { ScrollView, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Text } from '@/components/ui/Text';
import { mockTrustedContacts } from '@/data/mock';

export function NearbyResponders() {
  const nearby = mockTrustedContacts.filter((c) => c.isOnline).slice(0, 4);

  return (
    <View>
      <Text variant="label" className="mb-3">
        Trusted nearby
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="gap-3">
        {nearby.map((contact) => (
          <GlassCard key={contact.id} className="mr-3 w-36">
            <View className="items-center">
              <Avatar name={contact.name} online={contact.isOnline} />
              <Text variant="caption" className="mt-2 text-center font-medium">
                {contact.name}
              </Text>
              <Text variant="label" muted className="mt-1 normal-case">
                {contact.distanceKm != null ? `${contact.distanceKm} km` : 'Nearby'}
              </Text>
            </View>
          </GlassCard>
        ))}
      </ScrollView>
    </View>
  );
}
