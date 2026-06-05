import { useQuery } from '@tanstack/react-query';
import { authenticatedRequest } from '@/services/api/client';
import { mapGroupToActivityItem, type ApiGroupOut } from '@/services/api/mappers';
import type { ActivityItem } from '@/types';

/** API has no /alerts/history yet — show real group activity until history endpoint exists. */
export function useActivity() {
  return useQuery({
    queryKey: ['activity'],
    queryFn: async (): Promise<ActivityItem[]> => {
      const groups = await authenticatedRequest<ApiGroupOut[]>('/groups');
      return groups
        .map(mapGroupToActivityItem)
        .sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    },
    retry: 1,
  });
}
