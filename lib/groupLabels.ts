import type { Group } from '@/types';

function memberLabel(count: number): string {
  return count === 1 ? '1 member' : `${count} members`;
}

/** Distinguish circles that share the same display name (e.g. two "Family" groups). */
export function formatGroupSubtitle(group: Group): string {
  const members = memberLabel(group.memberCount);
  if (group.myRole === 'owner') {
    return `${members} · your circle`;
  }
  if (group.myRole === 'admin') {
    return `${members} · you help manage`;
  }
  return `${members} · shared with you`;
}

export function formatGroupPickerLabel(group: Group): string {
  return `${group.name} · ${formatGroupSubtitle(group)}`;
}

export function hasOwnedGroupNamed(groups: Group[] | undefined, name: string): boolean {
  const normalized = name.trim().toLowerCase();
  if (!normalized || !groups?.length) return false;
  return groups.some(
    (group) => group.myRole === 'owner' && group.name.trim().toLowerCase() === normalized
  );
}
