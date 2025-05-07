import { formatTime } from '@/lib/utils';
import { Event, EventType, StopwatchTimers } from '@/types/stopwatch';
import { Button } from '@repo/ui/components/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';

interface RecapDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  timers: StopwatchTimers;
  earnings: string;
  events: Event[];
  onNewSession(): void;
}

export function RecapDialog({
  open,
  onOpenChange,
  timers,
  earnings,
  events,
  onNewSession,
}: RecapDialogProps) {
  const getEventColor = (type: EventType) => {
    switch (type) {
      case 'start':
      case 'resume':
        return 'border-blue-500';
      case 'break':
        return 'border-yellow-500';
      case 'extended_break':
        return 'border-orange-500';
      case 'finish':
        return 'border-red-500';
      default:
        return 'border-gray-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Time Tracking Results</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Here's a summary of your time tracking session.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span>Work Time</span>
              <span>{formatTime(timers.work)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span>Break Time</span>
              <span>{formatTime(timers.break)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span>Extended Break</span>
              <span>{formatTime(timers.extBreak)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span>Total Time</span>
              <span>{formatTime(timers.total)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span>Earnings ($)</span>
              <span>${earnings}</span>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Event Timeline</h3>
            <div className="text-sm space-y-2">
              {events.map((ev, evIdx) => (
                <div
                  key={`event-${ev.type}-idx-${evIdx}`}
                  className={`flex justify-between items-center pl-3 py-2 border-l-4 rounded-sm bg-muted ${getEventColor(
                    ev.type
                  )}`}
                >
                  <span className="capitalize pl-1">
                    {ev.type.replace('_', ' ')}
                  </span>
                  <span className="text-gray-600 pr-4">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={onNewSession} className="w-full">
            Start New Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
