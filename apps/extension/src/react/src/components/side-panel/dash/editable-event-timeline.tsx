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
import { Button } from '@repo/ui/components/button';
import { ChartColumnBig, RotateCcw } from 'lucide-react';
import { useState, useMemo } from 'react';

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
  eventIndex: number;
  onEventChange: (index: number, updatedEvent: DashEvent) => void;
}

function EditableEventRow({
  event,
  eventIndex,
  onEventChange,
}: EditableEventRowProps) {
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [tempTimeValue, setTempTimeValue] = useState('');

  const handleActionChange = (newAction: DashEventAction) => {
    onEventChange(eventIndex, { ...event, action: newAction });
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
    try {
      const [hours, minutes, seconds] = tempTimeValue.split(':').map(Number);
      const today = new Date();
      const newTimestamp = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        hours,
        minutes,
        seconds || 0
      ).getTime();

      onEventChange(eventIndex, { ...event, timestamp: newTimestamp });
      setIsEditingTime(false);
    } catch {
      console.error('Invalid time format');
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
    <TableRow key={`editable-event-${eventIndex}`}>
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

function roundTimestampToSecond(timestamp: number): number {
  return Math.floor(timestamp / 1000) * 1000;
}

function areEventsEqual(events1: DashEvent[], events2: DashEvent[]): boolean {
  if (events1.length !== events2.length) return false;

  return events1.every((event, index) => {
    const otherEvent = events2[index];
    return (
      event.action === otherEvent.action &&
      roundTimestampToSecond(event.timestamp) ===
        roundTimestampToSecond(otherEvent.timestamp)
    );
  });
}

export function EditableEventTimeline() {
  const { events } = useDashStore();
  const [localEvents, setLocalEvents] = useState<DashEvent[]>(events);

  const hasActualChanges = useMemo(() => {
    return !areEventsEqual(localEvents, events);
  }, [localEvents, events]);

  const handleEventChange = (index: number, updatedEvent: DashEvent) => {
    const newEvents = [...localEvents];
    newEvents[index] = updatedEvent;
    setLocalEvents(newEvents);
  };

  const handleRevert = () => {
    setLocalEvents(events);
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
          {hasActualChanges && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRevert}
              className="flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" />
              Revert
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {localEvents.length > 0 ? (
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
                {localEvents.map((event, eventIndex) => (
                  <EditableEventRow
                    key={`event-row-${eventIndex}`}
                    event={event}
                    eventIndex={eventIndex}
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
