import { EventTimeline } from '@/components/side-panel/event-timeline';
import { useAppSettings } from '@/hooks/use-app-settings';
import { EventType, EventVariants, PayloadOf } from '@/types/event';
import { TableCell, TableRow } from '@repo/ui/components/table';
import { useCallback, useMemo } from 'react';

// Color mapping for different actions
const ACTION_COLOR_MAP: Record<string, string> = {
  // Stopwatch colors
  start: 'text-green-600',
  break: 'text-amber-600',
  resume: 'text-blue-600',
  finish: 'text-purple-600',

  // Task colors
  task_complete: 'text-emerald-600',

  // Browser colors
  tab_open: 'text-sky-600',
  tab_close: 'text-rose-600',
  website_visit: 'text-indigo-600',
};

export function SPDetailsPage() {
  const { events, handleUrlClick } = useAppSettings();

  const stopwatchEvents = useMemo(
    () => events.filter((ev) => ev.type === 'stopwatch'),
    [events]
  );
  const taskEvents = useMemo(
    () => events.filter((ev) => ev.type === 'task'),
    [events]
  );
  const browserEvents = useMemo(
    () => events.filter((ev) => ev.type === 'browser'),
    [events]
  );

  const renderEvent = useCallback(
    <T extends EventType>(ev: EventVariants<T>, evIdx: number) => {
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
            {ev.type === 'browser' &&
            ev.action === 'website_visit' &&
            'payload' in ev ? (
              <button
                onClick={() =>
                  handleUrlClick(
                    ev.payload as PayloadOf<'browser', 'website_visit'>
                  )
                }
                className="text-sm text-blue-500 hover:underline text-left truncate max-w-[200px] block"
                title={
                  (ev.payload as PayloadOf<'browser', 'website_visit'>).url
                }
              >
                {(ev.payload as PayloadOf<'browser', 'website_visit'>).url}
              </button>
            ) : (
              <span className="text-muted-foreground text-sm">-</span>
            )}
          </TableCell>
          <TableCell className="text-right text-muted-foreground">
            {new Date(ev.timestamp).toLocaleTimeString()}
          </TableCell>
        </TableRow>
      );
    },
    [handleUrlClick]
  );

  return (
    <div className="space-y-6 p-4">
      <h1 className="text-2xl font-bold">Session Details</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <EventTimeline
          eventType="stopwatch"
          events={stopwatchEvents}
          title="Stopwatch Timeline"
          description="Track your work sessions, breaks, and completions"
          renderEvent={renderEvent}
        />

        <EventTimeline
          eventType="task"
          events={taskEvents}
          title="Task Timeline"
          description="Monitor your task completion progress"
          renderEvent={renderEvent}
        />

        <EventTimeline
          eventType="browser"
          events={browserEvents}
          title="Browser Timeline"
          description="See your browsing activity during the work session"
          renderEvent={renderEvent}
        />
      </div>
    </div>
  );
}
