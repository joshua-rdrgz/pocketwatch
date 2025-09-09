import { useDashStore } from '@/stores/dash-store';
import { DashEvent, DashEventAction } from '@repo/shared/types/dash';
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
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { Input } from '@repo/ui/components/input';
import { ChartColumnBig } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { validateAndSortDashEvents } from '@repo/shared/lib/dash-validation';
import toast from 'react-hot-toast';

const ACTION_COLOR_MAP: Record<string, string> = {
  start: 'text-green-600',
  break: 'text-amber-600',
  resume: 'text-blue-600',
  finish: 'text-purple-600',
};

const ACTION_OPTIONS: { value: DashEventAction; label: string }[] = [
  { value: 'start', label: 'Start' },
  { value: 'break', label: 'Break' },
  { value: 'resume', label: 'Resume' },
  { value: 'finish', label: 'Finish' },
];

interface EditableEventRowProps {
  event: DashEvent;
  allEvents: DashEvent[];
  onEventChange: (
    eventId: string,
    updates: Partial<Pick<DashEvent, 'action' | 'timestamp'>>
  ) => void;
}

function EditableEventRow({
  event,
  allEvents,
  onEventChange,
}: EditableEventRowProps) {
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [tempTimeValue, setTempTimeValue] = useState('');

  const handleActionChange = (newAction: DashEventAction) => {
    if (!event.id) {
      toast.error('Cannot modify event without ID');
      return;
    }

    const updatedEvents = allEvents.map((e) =>
      e.id === event.id ? { ...e, action: newAction } : e
    );

    try {
      validateAndSortDashEvents(updatedEvents);
      onEventChange(event.id, { action: newAction });
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Invalid change: ${error.message}`);
      } else {
        toast.error('Invalid action change');
      }
    }
  };

  const handleTimeClick = () => {
    const timeString = new Date(event.timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setTempTimeValue(timeString);
    setIsEditingTime(true);
  };

  const handleTimeSubmit = () => {
    if (!event.id) {
      toast.error('Cannot modify event without ID');
      setIsEditingTime(false);
      return;
    }

    try {
      const [hours, minutes, seconds] = tempTimeValue.split(':').map(Number);
      const eventDate = new Date(event.timestamp);
      const newTimestamp = new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate(),
        hours,
        minutes,
        seconds || 0
      ).getTime();

      const updatedEvents = allEvents.map((e) =>
        e.id === event.id ? { ...e, timestamp: newTimestamp } : e
      );

      validateAndSortDashEvents(updatedEvents);
      onEventChange(event.id, { timestamp: newTimestamp });
      setIsEditingTime(false);
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Invalid change: ${error.message}`);
      } else {
        toast.error('Invalid time format');
      }
      setIsEditingTime(false);
    }
  };

  const handleTimeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTimeSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingTime(false);
    }
  };

  return (
    <TableRow key={`editable-event-${event.id}`}>
      <TableCell className="font-medium">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hover:bg-muted rounded px-2 py-1 transition-colors text-left w-full">
              <span
                className={`capitalize ${ACTION_COLOR_MAP[event.action] || 'text-gray-600'}`}
              >
                {event.action.replace('_', ' ')}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {ACTION_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleActionChange(option.value)}
              >
                <span
                  className={`capitalize ${ACTION_COLOR_MAP[option.value] || 'text-gray-600'}`}
                >
                  {option.label}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
      <TableCell className="hidden min-[350px]:table-cell">
        <span className="text-muted-foreground text-sm">-</span>
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        {isEditingTime ? (
          <Input
            type="time"
            step="1"
            value={tempTimeValue}
            onChange={(e) => setTempTimeValue(e.target.value)}
            onBlur={handleTimeSubmit}
            onKeyDown={handleTimeKeyDown}
            className="w-28 h-6 text-xs text-right border-none p-1 ml-auto"
            autoFocus
          />
        ) : (
          <button
            onClick={handleTimeClick}
            className="hover:bg-muted rounded px-2 py-1 transition-colors text-xs ml-auto block"
          >
            {new Date(event.timestamp).toLocaleTimeString()}
          </button>
        )}
      </TableCell>
    </TableRow>
  );
}

export function EditableEventTimeline() {
  const { events, adjustEvent } = useDashStore();
  const lastEventsRef = useRef<DashEvent[]>([]);

  useEffect(() => {
    if (events.length > 0) {
      // Only show toast if events actually changed (not just a re-render)
      const eventsChanged =
        JSON.stringify(events) !== JSON.stringify(lastEventsRef.current);
      if (eventsChanged) {
        toast.success('Timeline synced with server', { duration: 2000 });
        lastEventsRef.current = events;
      }
    }
  }, [events]);

  const handleEventChange = (
    eventId: string,
    updates: Partial<Pick<DashEvent, 'action' | 'timestamp'>>
  ) => {
    adjustEvent(eventId, updates);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Event Timeline</CardTitle>
            <CardDescription>
              Review and adjust your dash events - click on actions or times to
              edit
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {events.length > 0 ? (
          <div className="overflow-hidden rounded-lg border">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Action</TableHead>
                  <TableHead className="text-xs hidden min-[350px]:table-cell">
                    Details
                  </TableHead>
                  <TableHead className="text-xs text-right">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {events.map((event) => (
                  <EditableEventRow
                    key={event.id || `event-${event.timestamp}`}
                    event={event}
                    allEvents={events}
                    onEventChange={handleEventChange}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={3} className="p-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <ChartColumnBig className="mb-2 h-10 w-10 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-1">
                        No events yet...
                      </h3>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
