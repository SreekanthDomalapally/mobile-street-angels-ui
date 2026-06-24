import { useQuery } from '@tanstack/react-query';
import { authenticatedRequest } from '@/services/api/client';
import { mapAlertToActivityItem, type ApiAlertOut } from '@/services/api/mappers';
import type { ActivityItem } from '@/types';

export function useActivity() {
  return useQuery({
    queryKey: ['activity'],
    queryFn: async (): Promise<ActivityItem[]> => {
      const alerts = await authenticatedRequest<ApiAlertOut[]>('/alerts');
      return alerts
        .map(mapAlertToActivityItem)
        .sort(
          (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    },
    retry: 1,
    staleTime: 0,
  });
}
