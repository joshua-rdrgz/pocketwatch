import { getEventColorByType } from '@/lib/utils';
import { Event } from '@/types/stopwatch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';

interface EventTimelineProps {
  events: Event[];
}

export function EventTimeline({ events }: EventTimelineProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Event Timeline</CardTitle>
        <CardDescription>
          View your complete work session history. Analyze patterns and maintain
          accountability with detailed timestamps.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {events.length > 0 ? (
            events.map((ev, evIdx) => (
              <div
                key={`event-${ev.type}-idx-${evIdx}`}
                className={`bg-muted text-muted-foreground flex justify-between items-center p-3 rounded-lg transition-all duration-200 hover:scale-[1.01] border-l-3 ${getEventColorByType(ev.type)}`}
              >
                <span className="font-medium capitalize">
                  {ev.type.replace('_', ' ')}
                </span>
                <span className="text-muted-foreground">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </span>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center rounded-lg bg-muted/30">
              <div className="mb-2 text-4xl">📊</div>
              <h3 className="text-lg font-medium mb-1">No events yet...</h3>
              <p className="text-muted-foreground">
                Get started on the browser panel!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
