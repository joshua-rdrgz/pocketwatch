import { EventTimeline } from '@/components/side-panel/event-timeline';
import { useDashStore } from '@/stores/dash-store';
import { DashEvent } from '@repo/shared/types/dash';
import { TableCell, TableRow } from '@repo/ui/components/table';
import { useCallback } from 'react';

// Color mapping for different actions
const ACTION_COLOR_MAP: Record<string, string> = {
  start: 'text-green-600',
  break: 'text-amber-600',
  resume: 'text-blue-600',
  finish: 'text-purple-600',
};

export function DashTimelineScreen() {
  const { events } = useDashStore();

  const renderEvent = useCallback((ev: DashEvent, evIdx: number) => {
    return (
      <TableRow key={`event-${ev.action}-idx-${evIdx}`}>
        <TableCell className="font-medium">
          <span
            className={`capitalize ${ACTION_COLOR_MAP[ev.action] || 'text-gray-600'}`}
          >
            {ev.action.replace('_', ' ')}
          </span>
        </TableCell>
        <TableCell>
          <span className="text-muted-foreground text-sm">-</span>
        </TableCell>
        <TableCell className="text-right text-muted-foreground">
          {new Date(ev.timestamp).toLocaleTimeString()}
        </TableCell>
      </TableRow>
    );
  }, []);

  return (
    <div className="space-y-6 p-4">
      <EventTimeline
        events={events}
        title="Dash Timeline"
        description="Track your work dashes, breaks, and completions"
        renderEvent={renderEvent}
      />
    </div>
  );
}
