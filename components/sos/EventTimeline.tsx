import { Text } from "@/components/ui/Text";
import { formatSosEventTime } from "@/lib/utils";
import type { TimelineEvent } from "@/types";
import { View } from "react-native";

interface EventTimelineProps {
  events: TimelineEvent[];
}

export function EventTimeline({ events }: EventTimelineProps) {
  return (
    <View accessibilityLabel="Alert timeline">
      {events.map((event, index) => (
        <View key={event.id} className="flex-row gap-3 pb-4">
          <View className="items-center">
            <View
              className={`h-3 w-3 rounded-full ${
                event.type === "responder" ? "bg-responder" : "bg-charcoal-500"
              }`}
            />
            {index < events.length - 1 && (
              <View
                className="mt-1 w-0.5 flex-1 bg-charcoal-700"
                style={{ minHeight: 24 }}
              />
            )}
          </View>
          <View className="flex-1 pb-2">
            <Text variant="body">{event.title}</Text>
            {event.description && (
              <Text variant="caption" muted>
                {event.description}
              </Text>
            )}
            <Text variant="label" muted className="mt-1 normal-case">
              {formatSosEventTime(event.timestamp)}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
}
