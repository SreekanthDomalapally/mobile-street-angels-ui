import { Text } from '@/components/ui/Text';
import { useAuthStore } from '@/stores/authStore';
import type { Group, GroupMember, GroupPendingInvite } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ActivityIndicator, Pressable, View } from 'react-native';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function roleLabel(role: string, isYou: boolean): string {
  if (isYou) return 'You';
  if (role === 'owner') return 'Owner';
  if (role === 'admin') return 'Admin';
  return 'Member';
}

function MemberRow({
  member,
  isYou,
  canRemove,
  removing,
  onRemove,
}: {
  member: GroupMember;
  isYou: boolean;
  canRemove: boolean;
  removing: boolean;
  onRemove?: (member: GroupMember) => void;
}) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-glass-border bg-charcoal-900 p-4">
      <View className="h-11 w-11 items-center justify-center rounded-full bg-responder/20">
        <Text variant="label" className="text-responder-light">
          {initials(member.displayName)}
        </Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text variant="body" numberOfLines={1}>
          {member.displayName}
        </Text>
        <Text variant="caption" muted numberOfLines={1}>
          {member.email}
        </Text>
      </View>
      <View className="rounded-full bg-charcoal-800 px-2.5 py-1">
        <Text variant="label" muted className="normal-case">
          {roleLabel(member.role, isYou)}
        </Text>
      </View>
      {canRemove && onRemove ? (
        <Pressable
          onPress={() => onRemove(member)}
          disabled={removing}
          accessibilityRole="button"
          accessibilityLabel={`Remove ${member.displayName} from circle`}
          hitSlop={8}
          className="p-1">
          {removing ? (
            <ActivityIndicator size="small" color="#e85d5d" />
          ) : (
            <Ionicons name="close-circle-outline" size={24} color="#e85d5d" />
          )}
        </Pressable>
      ) : null}
    </View>
  );
}

function PendingRow({ invite }: { invite: GroupPendingInvite }) {
  return (
    <View className="flex-row items-center gap-3 rounded-2xl border border-warning/30 bg-warning/5 p-4">
      <View className="h-11 w-11 items-center justify-center rounded-full bg-warning/15">
        <Ionicons name="time-outline" size={20} color="#c9a04a" />
      </View>
      <View className="min-w-0 flex-1">
        <Text variant="body" numberOfLines={1}>
          {invite.inviteeEmail}
        </Text>
        <Text variant="caption" muted>
          Request sent · waiting to accept
        </Text>
      </View>
      <Text variant="label" className="text-warning">
        Pending
      </Text>
    </View>
  );
}

interface GroupMembersSectionProps {
  group?: Group | null;
  loading?: boolean;
  canManageMembers?: boolean;
  removingUserId?: string | null;
  onRemoveMember?: (member: GroupMember) => void;
}

export function GroupMembersSection({
  group,
  loading = false,
  canManageMembers = false,
  removingUserId = null,
  onRemoveMember,
}: GroupMembersSectionProps) {
  const currentUser = useAuthStore((s) => s.user);

  const members = useMemo(() => {
    if (!group) return [] as GroupMember[];

    const fromApi = [...group.members];
    if (!currentUser) return fromApi;

    const alreadyListed = fromApi.some((member) => member.userId === currentUser.id);
    if (!alreadyListed) {
      fromApi.unshift({
        userId: currentUser.id,
        displayName: currentUser.displayName,
        email: currentUser.email,
        role: group.myRole ?? 'owner',
      });
    }

    return fromApi.sort((a, b) => {
      const rank = (role: string) => (role === 'owner' ? 0 : role === 'admin' ? 1 : 2);
      const byRole = rank(a.role) - rank(b.role);
      if (byRole !== 0) return byRole;
      return a.displayName.localeCompare(b.displayName);
    });
  }, [group, currentUser]);

  const pendingInvites = group?.pendingInvites ?? [];
  const memberCount = Math.max(group?.memberCount ?? 0, members.length);
  const awaitingDetail =
    !loading && Boolean(group) && members.length === 0 && (group?.memberCount ?? 0) > 0;

  if (loading || awaitingDetail) {
    return (
      <View className="mb-6 items-center py-6">
        <ActivityIndicator color="#6bb892" />
        <Text variant="caption" muted className="mt-3">
          Loading group members…
        </Text>
      </View>
    );
  }

  if (!group) {
    return null;
  }

  return (
    <View className="mb-6">
      <Text variant="label" className="mb-3">
        Members ({memberCount})
      </Text>

      {members.length === 0 ? (
        <View className="mb-4 rounded-2xl border border-glass-border bg-charcoal-900 p-4">
          <Text variant="body" muted>
            You are the only member so far. Send a request below to add people.
          </Text>
        </View>
      ) : (
        <View className="mb-4 gap-3">
          {members.map((member) => {
            const isYou = member.userId === currentUser?.id;
            const canRemove =
              canManageMembers &&
              member.role !== 'owner' &&
              !isYou &&
              Boolean(onRemoveMember);
            return (
              <MemberRow
                key={member.userId}
                member={member}
                isYou={isYou}
                canRemove={canRemove}
                removing={removingUserId === member.userId}
                onRemove={onRemoveMember}
              />
            );
          })}
        </View>
      )}

      {pendingInvites.length > 0 && (
        <>
          <Text variant="label" className="mb-3">
            Pending requests ({pendingInvites.length})
          </Text>
          <View className="gap-3">
            {pendingInvites.map((invite) => (
              <PendingRow key={invite.id} invite={invite} />
            ))}
          </View>
        </>
      )}
    </View>
  );
}
