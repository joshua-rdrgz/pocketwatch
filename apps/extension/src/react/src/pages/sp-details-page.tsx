import { EventTimeline } from '@/components/side-panel/event-timeline';
import { useAppSettings } from '@/hooks/use-app-settings';
import { EventVariants } from '@/types/event';
import { useMemo } from 'react';

// Hardcoded browser events for demonstration
const BROWSER_EVENTS: EventVariants<'browser'>[] = [
  {
    type: 'browser',
    action: 'tab_open',
    timestamp: Date.now() - 3600000, // 1 hour ago
  },
  {
    type: 'browser',
    action: 'website_visit',
    timestamp: Date.now() - 3000000, // 50 minutes ago
    payload: 'https://example.com',
  },
  {
    type: 'browser',
    action: 'tab_close',
    timestamp: Date.now() - 1800000, // 30 minutes ago
  },
  {
    type: 'browser',
    action: 'website_visit',
    timestamp: Date.now() - 600000, // 10 minutes ago
    payload: 'https://docs.example.com',
  },
];

export function SPDetailsPage() {
  const { events } = useAppSettings();

  const stopwatchEvents = useMemo(
    () => events.filter((ev) => ev.type === 'stopwatch'),
    [events]
  );
  const taskEvents = useMemo(
    () => events.filter((ev) => ev.type === 'task'),
    [events]
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
        />

        <EventTimeline
          eventType="task"
          events={taskEvents}
          title="Task Timeline"
          description="Monitor your task completion progress"
        />

        <EventTimeline
          eventType="browser"
          events={BROWSER_EVENTS}
          title="Browser Timeline"
          description="See your browsing activity during the work session"
        />
      </div>
    </div>
  );
}
