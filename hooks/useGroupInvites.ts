import { acceptGroupInvite, declineGroupInvite, fetchMyGroupInvites } from '@/services/api/groups';
import { useFocusEffect } from 'expo-router';
import { useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useGroupInvites() {
  const query = useQuery({
    queryKey: ['group-invites'],
    queryFn: () => fetchMyGroupInvites(),
    retry: 1,
    staleTime: 0,
  });

  useFocusEffect(
    useCallback(() => {
      void query.refetch();
    }, [query.refetch])
  );

  return query;
}

export function useAcceptGroupInvite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (inviteId: string) => acceptGroupInvite(inviteId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-invites'] });
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group'] });
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
