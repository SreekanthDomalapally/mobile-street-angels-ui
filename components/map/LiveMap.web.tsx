import { View } from 'react-native';
import { Text } from '@/components/ui/Text';
import type { Coordinates, Responder } from '@/types';
import { MOCK_USER_LOCATION } from '@/data/mock';

interface LiveMapProps {
  userLocation?: Coordinates | null;
  responders?: Responder[];
  followUser?: boolean;
  onLiveLocationChange?: (coords: Coordinates) => void;
  className?: string;
}

export function LiveMap({
  userLocation = MOCK_USER_LOCATION,
  responders = [],
}: LiveMapProps) {
  return (
    <View
      className="flex-1 items-center justify-center bg-charcoal-900 px-6"
      accessibilityLabel="Map preview unavailable on web">
      <Text variant="label" className="mb-2 text-responder-light">
        Live map
      </Text>
      <Text variant="caption" muted className="text-center">
        Map is available on iOS and Android. Use a device or emulator to view your location during
        an active SOS.
      </Text>
      <Text variant="caption" muted className="mt-4 text-center">
        {userLocation?.latitude.toFixed(4)}, {userLocation?.longitude.toFixed(4)}
        {responders.length > 0 ? ` · ${responders.length} responder(s)` : ''}
      </Text>
    </View>
  );
}
