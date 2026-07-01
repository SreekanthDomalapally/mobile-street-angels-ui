import { GroupDetailScreen } from '@/components/groups/GroupDetailScreen';
import { LoadingState } from '@/components/common/LoadingState';
import { useLocalSearchParams } from 'expo-router';

export default function GroupDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  if (!id) {
    return <LoadingState message="Loading group…" />;
  }

  return <GroupDetailScreen groupId={id} />;
}
