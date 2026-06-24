import { Button } from '@/components/ui/Button';
import { ErrorState } from '@/components/common/ErrorState';
import { GlassCard } from '@/components/ui/GlassCard';
import { LoadingState } from '@/components/common/LoadingState';
import { LiveMap } from '@/components/map/LiveMap';
import { Text } from '@/components/ui/Text';
import { EmergencyDisclaimer } from '@/components/sos/EmergencyDisclaimer';
import { distanceKm, estimateEtaMinutes, formatDistance } from '@/lib/geo';
import {
  dialEmergencyServices,
  emergencyDialLabel,
  isEmergencyDialEnabled,
} from '@/lib/emergencyDial';
import { fetchAlert, respondToAlert } from '@/services/api/alerts';
import { getAccessToken } from '@/services/tokens';
import { getCurrentLocation } from '@/services/location';
import { alertSocket } from '@/services/websocket';
import { ApiError } from '@/services/api/client';
import type { Coordinates, SOSAlert } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { Linking, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function AlertResponseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const queryClient = useQueryClient();
  const [actionError, setActionError] = useState<string | null>(null);
  const [liveAlert, setLiveAlert] = useState<SOSAlert | null>(null);
  const [responderLocation, setResponderLocation] = useState<Coordinates | null>(null);

  const [wsConnected, setWsConnected] = useState(false);

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
    refetchInterval: wsConnected ? false : 15000,
  });

  useEffect(() => {
    if (alert) {
      setLiveAlert(alert);
    }
  }, [alert]);

  useEffect(() => {
    if (!id || !liveAlert) return;

    let cancelled = false;

    (async () => {
      const token = await getAccessToken();
      if (!token || cancelled) return;

      alertSocket.connect(id, token);
      if (!cancelled) setWsConnected(true);
      alertSocket.onRespondersUpdate((responders) => {
        setLiveAlert((current) => (current ? { ...current, responders } : current));
      });
      alertSocket.onTimelineEvent(() => undefined);
      alertSocket.onStatusChange((status) => {
        if (status === 'resolved') {
          router.replace('/(tabs)');
        }
      });
      alertSocket.onLocationUpdate((coords) => {
        setLiveAlert((current) => (current ? { ...current, location: coords } : current));
      });
    })();

    getCurrentLocation({ highAccuracy: true })
      .then((coords) => {
        if (!cancelled) setResponderLocation(coords);
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
      setWsConnected(false);
      alertSocket.disconnect();
    };
  }, [id, liveAlert?.id]);

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

  if (isLoading || !liveAlert) {
    return <LoadingState message="Loading alert…" />;
  }

  if (isError) {
    return <ErrorState onRetry={() => refetch()} />;
  }

  const distance =
    responderLocation && liveAlert.location
      ? distanceKm(responderLocation, liveAlert.location)
      : null;

  const navigate = () =>
    Linking.openURL(
      `https://maps.google.com/?q=${liveAlert.location.latitude},${liveAlert.location.longitude}`
    );

  const callUser = () => {
    if (!liveAlert.creatorPhone) return;
    void Linking.openURL(`tel:${liveAlert.creatorPhone}`);
  };

  const callEmergency = () => {
    void dialEmergencyServices().catch(() => undefined);
  };

  const respond = (
    responseType: 'i_can_help' | 'on_my_way' | 'calling_now' | 'unable_to_help',
    etaMinutes?: number
  ) => {
    respondMutation.mutate({ responseType, etaMinutes });
  };

  return (
    <View className="flex-1 bg-charcoal-950">
      <View className="h-[42%]">
        <LiveMap userLocation={liveAlert.location} followUser={false} />
        <Pressable
          onPress={() => router.back()}
          className="absolute left-4 rounded-full bg-charcoal-900/90 px-4 py-2"
          style={{ top: insets.top + 8 }}>
          <Text variant="caption">Close</Text>
        </Pressable>
      </View>

      <ScrollView
        className="flex-1 px-5"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: 20 }}>
        <View className="mb-4 flex-row items-center gap-3">
          <View className="h-12 w-12 items-center justify-center rounded-full bg-emergency/20">
            <Ionicons name="alert-circle" size={28} color="#e85d5d" />
          </View>
          <View className="flex-1">
            <Text variant="title">
              {liveAlert.creatorName ? `${liveAlert.creatorName} needs help` : 'Someone needs help'}
            </Text>
            <Text variant="caption" muted>
              {liveAlert.type} · {new Date(liveAlert.createdAt).toLocaleTimeString()}
            </Text>
          </View>
        </View>

        <EmergencyDisclaimer compact className="mb-4" />

        {distance != null && (
          <GlassCard className="mb-4">
            <Text variant="label" className="mb-1">
              Distance to alert
            </Text>
            <Text variant="body">
              {formatDistance(distance)} · about {estimateEtaMinutes(distance)} min away
            </Text>
          </GlassCard>
        )}

        <GlassCard className="mb-6">
          <Text variant="label" className="mb-2">
            Alert details
          </Text>
          <Text variant="body">{liveAlert.message ?? 'Emergency assistance requested'}</Text>
        </GlassCard>

        {actionError && (
          <Text variant="caption" className="mb-4 text-emergency">
            {actionError}
          </Text>
        )}

        <View className="gap-3">
          {liveAlert.creatorPhone ? (
            <Button
              title="Call user"
              variant="emergency"
              size="lg"
              icon={<Ionicons name="call" size={20} color="#fff" style={{ marginRight: 8 }} />}
              loading={respondMutation.isPending}
              onPress={callUser}
            />
          ) : null}
          {isEmergencyDialEnabled() ? (
            <Button
              title={emergencyDialLabel()}
              variant="secondary"
              icon={<Ionicons name="medkit" size={20} color="#fff" style={{ marginRight: 8 }} />}
              onPress={callEmergency}
            />
          ) : null}
          <Button
            title="I can help"
            variant="emergency"
            size="lg"
            loading={respondMutation.isPending}
            onPress={() => respond('i_can_help')}
          />
          <Button
            title={
              distance != null
                ? `On my way (~${estimateEtaMinutes(distance)} min)`
                : 'On my way'
            }
            variant="primary"
            loading={respondMutation.isPending}
            onPress={() => respond('on_my_way', distance ? estimateEtaMinutes(distance) : 5)}
          />
          <Button
            title="Open navigation"
            variant="secondary"
            icon={<Ionicons name="navigate" size={20} color="#fff" style={{ marginRight: 8 }} />}
            onPress={navigate}
          />
          <Button
            title="Unable to help"
            variant="ghost"
            loading={respondMutation.isPending}
            onPress={() => respond('unable_to_help')}
          />
        </View>
      </ScrollView>
    </View>
  );
}
