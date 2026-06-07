import { useGroups } from '@/hooks/useGroups';
import type { Group } from '@/types';
import { useMemo } from 'react';

export function useManagedGroups(): Group[] {
  const { data: groups } = useGroups();
  return useMemo(
    () => (groups ?? []).filter((group) => group.myRole === 'owner' || group.myRole === 'admin'),
    [groups]
  );
}
