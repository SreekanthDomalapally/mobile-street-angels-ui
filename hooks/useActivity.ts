import { useQuery } from '@tanstack/react-query';
import { ApiError, authenticatedRequest } from '@/services/api/client';
import { mapAlertToActivityItem, type ApiAlertOut } from '@/services/api/mappers';
import type { ActivityItem } from '@/types';

export function getActivityErrorMessage(error: unknown): string {
  if (error instanceof ApiError) return error.message;
  if (error instanceof Error && error.message) return error.message;
  return 'Please check your connection and try again.';
}

export function useActivity() {
  return useQuery({
    queryKey: ['activity'],
    queryFn: async (): Promise<ActivityItem[]> => {
      const alerts = await authenticatedRequest<ApiAlertOut[]>('/alerts');
      const items: ActivityItem[] = [];
      for (const alert of alerts) {
        try {
          items.push(mapAlertToActivityItem(alert));
        } catch (error) {
          console.warn('[activity] Skipping alert row:', alert?.id, error);
        }
      }
      return items.sort(
        (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
    },
    retry: 1,
    staleTime: 30_000,
  });
}
