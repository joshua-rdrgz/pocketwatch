import { EventType, EventVariants } from '@/types/event';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { ChartColumnBig } from 'lucide-react';

// Color mapping for different actions
const ACTION_COLOR_MAP: Record<string, string> = {
  // Stopwatch colors
  start: 'border-green-500',
  break: 'border-amber-500',
  resume: 'border-blue-500',
  finish: 'border-purple-500',

  // Task colors
  task_complete: 'border-emerald-500',

  // Browser colors
  tab_open: 'border-sky-500',
  tab_close: 'border-rose-500',
  website_visit: 'border-indigo-500',
};

interface EventTimelineProps<T extends EventType> {
  eventType: T;
  events: EventVariants<T>[];
  title: string;
  description: string;
}

export function EventTimeline<T extends EventType>({
  eventType,
  events,
  title,
  description,
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
            events.map((ev, evIdx) => (
              <div
                key={`event-${ev.action}-idx-${evIdx}`}
                className={`bg-muted text-muted-foreground flex justify-between items-center p-3 rounded-lg transition-all duration-200 hover:scale-[1.01] border-l-4 ${
                  ACTION_COLOR_MAP[ev.action] || 'border-gray-500'
                }`}
              >
                <span className="font-medium capitalize">
                  {ev.action.replace('_', ' ')}
                </span>
                <span className="text-sm opacity-70">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
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
