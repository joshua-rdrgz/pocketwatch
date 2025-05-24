import { EventTimeline } from '@/components/side-panel/event-timeline';
import { useAppSettings } from '@/hooks/use-app-settings';
import { EventType, EventVariants, PayloadOf } from '@/types/event';
import { useCallback, useMemo } from 'react';

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
        <div
          key={`event-${ev.action}-idx-${evIdx}`}
          className={`bg-muted text-muted-foreground flex justify-between items-center p-3 rounded-lg transition-all duration-200 hover:scale-[1.01] border-l-4 ${
            ACTION_COLOR_MAP[ev.action] || 'border-gray-500'
          }`}
        >
          <div className="flex flex-col">
            <span className="font-medium capitalize">
              {ev.action.replace('_', ' ')}
            </span>
            {ev.type === 'browser' &&
              ev.action === 'website_visit' &&
              'payload' in ev && (
                <button
                  onClick={() =>
                    handleUrlClick(
                      ev.payload as PayloadOf<'browser', 'website_visit'>
                    )
                  }
                  className="text-sm text-blue-500 hover:underline text-left"
                >
                  {(ev.payload as PayloadOf<'browser', 'website_visit'>).url}
                </button>
              )}
          </div>
          <span className="text-sm opacity-70">
            {new Date(ev.timestamp).toLocaleTimeString()}
          </span>
        </div>
      );
    },
    []
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
