import { EventType, EventVariants } from '@/types/event';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { ChartColumnBig } from 'lucide-react';

interface EventTimelineProps<T extends EventType> {
  eventType: T;
  events: EventVariants<T>[];
  title: string;
  description: string;
  renderEvent(ev: EventVariants<T>, evIdx: number): React.ReactElement;
}

export function EventTimeline<T extends EventType>({
  eventType,
  events,
  title,
  description,
  renderEvent,
}: EventTimelineProps<T>) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {events.length > 0 ? (
            events.map((ev, evIdx) => renderEvent(ev, evIdx))
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center rounded-lg bg-muted/30">
              <div className="mb-2 text-4xl">
                <ChartColumnBig />
              </div>
              <h3 className="text-lg font-medium mb-1">
                No {eventType} events yet...
              </h3>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
