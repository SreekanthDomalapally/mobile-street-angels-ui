import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  fetchMyProfile,
  fetchMySkills,
  setMySkills,
  updateResponderProfile,
  type UserSkillInput,
} from '@/services/api/responder';
import type { ResponderProfile } from '@/types';

export function useMySkills() {
  return useQuery({
    queryKey: ['my-skills'],
    queryFn: fetchMySkills,
    staleTime: 1000 * 60 * 5,
  });
}

export function useSetMySkills() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (skills: UserSkillInput[]) => setMySkills(skills),
    onSuccess: (data) => {
      queryClient.setQueryData(['my-skills'], data);
    },
  });
}

export function useResponderProfile() {
  return useQuery({
    queryKey: ['responder-profile'],
    queryFn: fetchMyProfile,
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdateResponderProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates: Partial<ResponderProfile>) => updateResponderProfile(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['responder-profile'] });
    },
  });
}
