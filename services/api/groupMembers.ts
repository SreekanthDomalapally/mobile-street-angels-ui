import type { Group, GroupMember } from '@/types';
import { fetchContactDirectory } from './contacts';
import { fetchGroup, fetchGroups } from './groups';
import { mapApiGroupToGroup } from './mappers';
import { authenticatedRequest } from './client';
import type { ApiGroupOut } from './mappers';

function mergeMembers(group: Group, extra: GroupMember[]): Group {
  if (extra.length === 0) return group;

  const merged = [...group.members];
  for (const member of extra) {
    if (!merged.some((existing) => existing.userId === member.userId)) {
      merged.push(member);
    }
  }

  return {
    ...group,
    members: merged,
    memberCount: Math.max(group.memberCount, merged.length),
  };
}

async function membersFromDirectory(groupId: string): Promise<GroupMember[]> {
  const groups = await fetchGroups();
  const detailed = await Promise.all(groups.map((item) => fetchGroup(item.id)));
  const directory = await fetchContactDirectory(detailed);

  return directory
    .filter(
      (contact) =>
        contact.groupIds.includes(groupId) && contact.status === 'member' && contact.userId
    )
    .map((contact) => ({
      userId: contact.userId!,
      displayName: contact.displayName,
      email: contact.email ?? '',
      role: 'member',
    }));
}

/**
 * Loads a group and fills in members when the detail payload omits them.
 */
export async function fetchGroupWithMembers(groupId: string): Promise<Group> {
  const group = await fetchGroup(groupId);
  if (group.members.length > 0) {
    return group;
  }

  try {
    const list = await authenticatedRequest<ApiGroupOut[]>('/groups');
    const fromList = list.find((item) => item.id === groupId);
    if (fromList?.members?.length) {
      return mergeMembers(group, mapApiGroupToGroup(fromList).members);
    }
  } catch {
    // Fall through to directory lookup.
  }

  try {
    const fromDirectory = await membersFromDirectory(groupId);
    return mergeMembers(group, fromDirectory);
  } catch {
    return group;
  }
}
