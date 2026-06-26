import type { EmergencyType, Group } from '@/types';

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

/**
 * Summarises how many emergency types a circle responds to. An empty list means
 * the circle has no filter configured, so it is alerted for every emergency type.
 */
export function formatEmergencyTypeCount(group: Group): string {
  const count = group.emergencyTypes?.length ?? 0;
  if (count === 0) return 'All emergencies';
  return count === 1 ? '1 emergency type' : `${count} emergency types`;
}

/** Matches API routing: empty emergencyTypes means the circle responds to every type. */
export function groupHandlesEmergencyType(group: Group, code: EmergencyType): boolean {
  const configured = group.emergencyTypes ?? [];
  if (configured.length === 0) return true;
  return configured.includes(code);
}

/** How many of the user's circles would be alerted for a given emergency type. */
export function countCirclesForEmergencyType(
  groups: Group[] | undefined,
  code: EmergencyType,
  override?: { groupId: string; types: EmergencyType[] },
): number {
  if (!groups?.length) return 0;
  let count = 0;
  for (const group of groups) {
    if (override?.groupId === group.id) {
      const handlesAll = override.types.length === 0;
      if (handlesAll || override.types.includes(code)) count += 1;
    } else if (groupHandlesEmergencyType(group, code)) {
      count += 1;
    }
  }
  return count;
}

/** Unique people (excluding sender) who could be notified across matching circles. */
export function countUsersForEmergencyType(
  groups: Group[] | undefined,
  code: EmergencyType,
  excludeUserId?: string,
): number {
  if (!groups?.length) return 0;
  const userIds = new Set<string>();
  let estimate = 0;
  for (const group of groups) {
    if (!groupHandlesEmergencyType(group, code)) continue;
    if (group.members.length > 0) {
      for (const member of group.members) {
        if (excludeUserId && member.userId === excludeUserId) continue;
        userIds.add(member.userId);
      }
    } else {
      estimate += Math.max(0, (group.memberCount ?? 1) - 1);
    }
  }
  return userIds.size > 0 ? userIds.size : estimate;
}

/** People in one circle who would be notified for this type (excludes sender). */
export function countUsersForEmergencyTypeInGroup(
  group: Group | undefined,
  code: EmergencyType,
  excludeUserId?: string,
): number {
  if (!group || !groupHandlesEmergencyType(group, code)) return 0;
  if (group.members.length > 0) {
    return group.members.filter((m) => m.userId !== excludeUserId).length;
  }
  return Math.max(0, (group.memberCount ?? 1) - 1);
}

export function formatEmergencyTypeCircleCount(count: number): string {
  if (count === 0) return 'No circles';
  return count === 1 ? '1 circle' : `${count} circles`;
}

/** Compact badge for emergency-type chips (e.g. "2" or "0"). */
export function formatEmergencyTypeCircleCountBadge(count: number): string {
  return String(count);
}

export function hasOwnedGroupNamed(groups: Group[] | undefined, name: string): boolean {
  const normalized = name.trim().toLowerCase();
  if (!normalized || !groups?.length) return false;
  return groups.some(
    (group) => group.myRole === 'owner' && group.name.trim().toLowerCase() === normalized
  );
}

function pickDefaultGroup(groups: Group[], preferredId?: string | null): Group | undefined {
  if (preferredId) {
    const match = groups.find((g) => g.id === preferredId);
    if (match) return match;
  }
  return groups[0];
}

export function getSelectedSosGroupId(
  groups: Group[],
  preferredId?: string | null,
): string | undefined {
  return pickDefaultGroup(groups, preferredId)?.id;
}

/** Primary circle used when creating an SOS for a given emergency type. */
export function getSosGroupForEmergencyType(
  groups: Group[],
  emergencyType: EmergencyType,
  preferredId?: string | null,
): string | undefined {
  if (!groups.length) return undefined;

  if (preferredId) {
    const preferred = groups.find((g) => g.id === preferredId);
    if (preferred && groupHandlesEmergencyType(preferred, emergencyType)) {
      return preferred.id;
    }
  }

  const matching = groups.filter((g) => groupHandlesEmergencyType(g, emergencyType));
  return matching[0]?.id ?? groups[0]?.id;
}

export type EmergencyNotifyContact = {
  userId: string;
  displayName: string;
  email: string;
  groupNames: string[];
};

/** Unique people (excluding sender) notified across circles linked to this emergency type. */
export function getUniqueMembersForEmergencyType(
  groups: Group[] | undefined,
  code: EmergencyType,
  excludeUserId?: string,
): EmergencyNotifyContact[] {
  if (!groups?.length) return [];

  const byUserId = new Map<string, EmergencyNotifyContact>();
  for (const group of groups) {
    if (!groupHandlesEmergencyType(group, code)) continue;
    for (const member of group.members) {
      if (excludeUserId && member.userId === excludeUserId) continue;
      const existing = byUserId.get(member.userId);
      if (existing) {
        if (!existing.groupNames.includes(group.name)) {
          existing.groupNames.push(group.name);
        }
      } else {
        byUserId.set(member.userId, {
          userId: member.userId,
          displayName: member.displayName,
          email: member.email,
          groupNames: [group.name],
        });
      }
    }
  }

  return Array.from(byUserId.values()).sort((a, b) =>
    a.displayName.localeCompare(b.displayName),
  );
}
