import { useGroups } from '@/hooks/useGroups';
import { enrichCircleContacts } from '@/lib/enrichCircleContacts';
import { fetchContactDirectory } from '@/services/api/contacts';
import { fetchGroup, fetchGroups } from '@/services/api/groups';
import { useQuery } from '@tanstack/react-query';

async function loadGroupsWithMembers() {
  const groups = await fetchGroups();
  return Promise.all(groups.map((group) => fetchGroup(group.id)));
}

export function useCircleContacts() {
  const { data: groups } = useGroups();

  return useQuery({
    queryKey: ['contacts', 'directory', groups?.map((group) => group.id).join(',') ?? ''],
    queryFn: async () => {
      const detailed = await loadGroupsWithMembers();
      const directory = await fetchContactDirectory(detailed);
      return enrichCircleContacts(directory);
    },
    enabled: groups !== undefined,
    retry: 1,
  });
}
