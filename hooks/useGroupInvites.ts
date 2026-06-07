import { acceptGroupInvite, declineGroupInvite, fetchMyGroupInvites } from '@/services/api/groups';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useGroupInvites() {
  return useQuery({
    queryKey: ['group-invites'],
    queryFn: () => fetchMyGroupInvites(),
    retry: 1,
  });
}

export function useAcceptGroupInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => acceptGroupInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-invites'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
    },
  });
}

export function useDeclineGroupInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => declineGroupInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-invites'] });
    },
  });
}
