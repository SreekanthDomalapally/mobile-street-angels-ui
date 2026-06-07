import { fetchGroup } from '@/services/api/groups';
import { useQuery } from '@tanstack/react-query';

export function useGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: () => fetchGroup(groupId!),
    enabled: Boolean(groupId),
    retry: 1,
  });
}
