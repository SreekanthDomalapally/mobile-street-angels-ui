import { fetchGroupWithMembers } from '@/services/api/groupMembers';
import { useQuery } from '@tanstack/react-query';

export function useGroup(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group', groupId],
    queryFn: () => fetchGroupWithMembers(groupId!),
    enabled: Boolean(groupId),
    retry: 1,
    staleTime: 1000 * 60 * 2,
  });
}
