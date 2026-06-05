import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { GlassCard } from '@/components/ui/GlassCard';
import { LoadingState } from '@/components/common/LoadingState';
import { Text } from '@/components/ui/Text';
import { fetchAlert, respondToAlert } from '@/services/api/alerts';
import { ApiError } from '@/services/api/client';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AlertResponseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);

  const {
    data: alert,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ['alert', id],
    queryFn: () => fetchAlert(id!),
    enabled: Boolean(id),
    retry: 1,
  });

  const respondMutation = useMutation({
    mutationFn: ({
      responseType,
      etaMinutes,
    }: {
      responseType: 'i_can_help' | 'on_my_way' | 'calling_now' | 'unable_to_help';
      etaMinutes?: number;
    }) => respondToAlert(id!, responseType, etaMinutes),
    onSuccess: () => {
      setActionError(null);
      queryClient.invalidateQueries({ queryKey: ['alert', id] });
    },
    onError: (error) => {
      setActionError(
        error instanceof ApiError ? error.message : 'Could not send response. Try again.'
      );
    },
  });

  if (!id) {
    return (
      <View className="flex-1 bg-charcoal-950 px-5" style={{ paddingTop: insets.top + 24 }}>
        <Text variant="body">Invalid alert link.</Text>
      </View>
    );
  }

  if (isLoading) {
    return <LoadingState message="Loading alert…" />;
  }

  if (isError || !alert) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const callUser = () => Linking.openURL('tel:+15550100');
  const navigate = () =>
    Linking.openURL(
      `https://maps.google.com/?q=${alert.location.latitude},${alert.location.longitude}`
    );

  const respond = (
    responseType: 'i_can_help' | 'on_my_way' | 'calling_now' | 'unable_to_help',
    etaMinutes?: number
  ) => {
    respondMutation.mutate({ responseType, etaMinutes });
  };

  return (
    <View
      className="flex-1 bg-charcoal-950 px-5"
      style={{ paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}>
      <View className="mb-6 flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-full bg-emergency/20">
          <Ionicons name="alert-circle" size={28} color="#e85d5d" />
        </View>
        <View>
          <Text variant="title">Respond to alert</Text>
          <Text variant="caption" muted>
            Someone in your trusted group needs help
          </Text>
        </View>
      </View>

      <GlassCard className="mb-6">
        <Text variant="label" className="mb-2">
          Alert details
        </Text>
        <Text variant="body">{alert.message ?? 'Emergency assistance requested'}</Text>
        <Text variant="caption" muted className="mt-2">
          Type: {alert.type} · Status: {alert.status}
        </Text>
      </GlassCard>

      {actionError && (
        <Text variant="caption" className="mb-4 text-emergency">
          {actionError}
        </Text>
      )}

      <View className="gap-3">
        <Button
          title="I can help"
          variant="emergency"
          size="lg"
          loading={respondMutation.isPending}
          onPress={() => respond('i_can_help')}
        />
        <Button
          title="On my way (ETA 4 min)"
          variant="primary"
          loading={respondMutation.isPending}
          onPress={() => respond('on_my_way', 4)}
        />
        <Button
          title="Calling now"
          variant="secondary"
          loading={respondMutation.isPending}
          onPress={() => respond('calling_now')}
        />
        <Button
          title="Open navigation"
          variant="secondary"
          icon={
            <Ionicons name="navigate" size={20} color="#fff" style={{ marginRight: 8 }} />
          }
          onPress={navigate}
        />
        <Button
          title="Call person in need"
          variant="ghost"
          icon={<Ionicons name="call" size={20} color="#fff" style={{ marginRight: 8 }} />}
          onPress={callUser}
        />
        <Button
          title="Unable to help"
          variant="ghost"
          loading={respondMutation.isPending}
          onPress={() => respond('unable_to_help')}
        />
      </View>
    </View>
  );
}
