import { EventType, EventVariants } from '@/types/event';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
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
        {events.length > 0 ? (
          <div className="overflow-hidden rounded-lg border">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Action</TableHead>
                  <TableHead className="text-xs">Details</TableHead>
                  <TableHead className="text-xs text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((ev, evIdx) => renderEvent(ev, evIdx))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableBody>
                <TableRow>
                  <td colSpan={3} className="p-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <ChartColumnBig className="mb-2 h-10 w-10 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-1">
                        No {eventType} events yet...
                      </h3>
                    </div>
                  </td>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
