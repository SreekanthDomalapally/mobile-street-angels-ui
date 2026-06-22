import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createGroup, fetchGroups } from '@/services/api/groups';
import type { CreateGroupParams } from '@/services/api/groups';

export function useGroups() {
  return useQuery({
    queryKey: ['groups'],
    queryFn: () => fetchGroups(),
    retry: 1,
    staleTime: 0,
  });
}

export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: CreateGroupParams) => createGroup(params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}
