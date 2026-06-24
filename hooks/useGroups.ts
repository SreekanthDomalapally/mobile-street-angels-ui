import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createGroup, fetchGroups, removeGroupMember, updateGroup } from '@/services/api/groups';
import type { CreateGroupParams, UpdateGroupParams } from '@/services/api/groups';

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

export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, params }: { groupId: string; params: UpdateGroupParams }) =>
      updateGroup(groupId, params),
    onSuccess: (group) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group', group.id] });
      queryClient.invalidateQueries({ queryKey: ['activity'] });
    },
  });
}

export function useRemoveGroupMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, userId }: { groupId: string; userId: string }) =>
      removeGroupMember(groupId, userId),
    onSuccess: (_data, { groupId }) => {
      queryClient.invalidateQueries({ queryKey: ['groups'] });
      queryClient.invalidateQueries({ queryKey: ['group', groupId] });
      queryClient.invalidateQueries({ queryKey: ['contacts'] });
      queryClient.invalidateQueries({ queryKey: ['group-invites'] });
    },
  });
}
