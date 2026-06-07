import { useGroups } from '@/hooks/useGroups';
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
      return fetchContactDirectory(detailed);
    },
    enabled: groups !== undefined,
    retry: 1,
  });
}
