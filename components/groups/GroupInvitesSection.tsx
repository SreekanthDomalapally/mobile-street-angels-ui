import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import {
  useAcceptGroupInvite,
  useDeclineGroupInvite,
  useGroupInvites,
} from '@/hooks/useGroupInvites';
import { ApiError } from '@/services/api/client';
import { useState } from 'react';
import { View } from 'react-native';

export function GroupInvitesSection() {
  const { data: invites, isLoading } = useGroupInvites();
  const acceptInvite = useAcceptGroupInvite();
  const declineInvite = useDeclineGroupInvite();
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !invites || invites.length === 0) {
    return null;
  }

  const handleAccept = async (inviteId: string) => {
    setError(null);
    try {
      await acceptInvite.mutateAsync(inviteId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not accept invite.');
    }
  };

  const handleDecline = async (inviteId: string) => {
    setError(null);
    try {
      await declineInvite.mutateAsync(inviteId);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not decline invite.');
    }
  };

  return (
    <View className="mb-6">
      <Text variant="label" className="mb-3">
        Circle invitations
      </Text>
      {error && (
        <Text variant="caption" className="mb-3 text-emergency">
          {error}
        </Text>
      )}
      {invites.map((invite) => (
        <View
          key={invite.id}
          className="mb-3 rounded-2xl border border-responder/30 bg-charcoal-900 p-4">
          <Text variant="body">{invite.groupName}</Text>
          <Text variant="caption" muted className="mt-1">
            {invite.inviterName} invited you to join this group.
          </Text>
          <View className="mt-3 flex-row gap-2">
            <Button
              title="Accept"
              size="sm"
              className="flex-1"
              loading={acceptInvite.isPending}
              onPress={() => handleAccept(invite.id)}
            />
            <Button
              title="Decline"
              size="sm"
              variant="secondary"
              className="flex-1"
              loading={declineInvite.isPending}
              onPress={() => handleDecline(invite.id)}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
