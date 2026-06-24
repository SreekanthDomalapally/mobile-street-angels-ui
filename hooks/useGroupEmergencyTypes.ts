import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchGroupEmergencyTypes,
  setGroupEmergencyTypes,
} from '@/services/api/groups';
import type { EmergencyType } from '@/types';

export function useGroupEmergencyTypes(groupId: string | undefined) {
  return useQuery({
    queryKey: ['group-emergency-types', groupId],
    queryFn: () => fetchGroupEmergencyTypes(groupId as string),
    enabled: Boolean(groupId),
    staleTime: 1000 * 60,
  });
}

export function useSetGroupEmergencyTypes(groupId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (types: EmergencyType[]) => setGroupEmergencyTypes(groupId, types),
    onSuccess: (data) => {
      queryClient.setQueryData(['group-emergency-types', groupId], data);
      queryClient.invalidateQueries({ queryKey: ['groups'] });
    },
  });
}
