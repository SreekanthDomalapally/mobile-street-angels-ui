import { Button } from '@/components/ui/Button';
import { Text } from '@/components/ui/Text';
import {
  acceptTrustedContactRequest,
  declineTrustedContactRequest,
  fetchTrustedContacts,
} from '@/services/api/trustedContacts';
import type { TrustedContactRelationship } from '@/types';
import { ApiError } from '@/services/api/client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { View } from 'react-native';

export function TrustedContactsPanel() {
  const queryClient = useQueryClient();
  const { data: trusted = [] } = useQuery({
    queryKey: ['trusted-contacts'],
    queryFn: fetchTrustedContacts,
    retry: 1,
  });

  const incoming = trusted.filter(
    (contact) => contact.isIncoming && contact.status === 'pending'
  );
  const accepted = trusted.filter((contact) => contact.status === 'accepted');

  const handleAccept = async (contact: TrustedContactRelationship) => {
    try {
      await acceptTrustedContactRequest(contact.id);
      await queryClient.invalidateQueries({ queryKey: ['trusted-contacts'] });
      await queryClient.invalidateQueries({ queryKey: ['contacts'] });
    } catch (error) {
      console.warn('[trusted] Accept failed:', error);
    }
  };

  const handleDecline = async (contact: TrustedContactRelationship) => {
    try {
      await declineTrustedContactRequest(contact.id);
      await queryClient.invalidateQueries({ queryKey: ['trusted-contacts'] });
    } catch (error) {
      if (error instanceof ApiError && (error.status === 404 || error.status === 501)) {
        return;
      }
      console.warn('[trusted] Decline failed:', error);
    }
  };

  if (incoming.length === 0 && accepted.length === 0) {
    return null;
  }

  return (
    <View className="mb-6">
      {incoming.length > 0 && (
        <>
          <Text variant="label" className="mb-3">
            Trusted contact requests
          </Text>
          {incoming.map((contact) => (
            <View
              key={contact.id}
              className="mb-3 rounded-2xl border border-responder/30 bg-charcoal-900 p-4">
              <Text variant="body">{contact.displayName}</Text>
              <Text variant="caption" muted className="mt-1">
                Wants to add you as a trusted contact
              </Text>
              <View className="mt-3 flex-row gap-2">
                <Button title="Accept" size="sm" className="flex-1" onPress={() => handleAccept(contact)} />
                <Button
                  title="Decline"
                  size="sm"
                  variant="secondary"
                  className="flex-1"
                  onPress={() => handleDecline(contact)}
                />
              </View>
            </View>
          ))}
        </>
      )}

      {accepted.length > 0 && (
        <>
          <Text variant="label" className="mb-3">
            Trusted contacts ({accepted.length})
          </Text>
          {accepted.map((contact) => (
            <View
              key={contact.id}
              className="mb-2 rounded-2xl border border-glass-border bg-charcoal-900 p-4">
              <Text variant="body">{contact.displayName}</Text>
              <Text variant="caption" muted className="mt-1">
                {contact.email ?? contact.phone ?? 'Connected'}
              </Text>
            </View>
          ))}
        </>
      )}
    </View>
  );
}
