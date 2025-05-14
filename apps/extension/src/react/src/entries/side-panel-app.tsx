import { EventTimeline } from '@/components/side-panel/event-timeline';
import { SessionSettings } from '@/components/side-panel/session-settings';
import { SidePanelActions } from '@/components/side-panel/side-panel-actions';
import { SidePanelHeader } from '@/components/side-panel/side-panel-header';
import { TimeTracker } from '@/components/side-panel/time-tracker';
import { AppSettingsProvider } from '@/hooks/use-app-settings';
import { useSidePanelSetup } from '@/hooks/use-side-panel-setup';
import { StopwatchProvider } from '@/hooks/use-stopwatch';

export default function SidePanelApp() {
  // Set up Side Panel w/Service Worker
  useSidePanelSetup();

  return (
    <main className="bg-background w-full min-h-svh p-6 flex flex-col gap-6 text-container">
      <AppSettingsProvider>
        <StopwatchProvider>
          <SidePanelHeader />
          <SidePanelActions />
          <SessionSettings />
          <EventTimeline />
          <TimeTracker />
        </StopwatchProvider>
      </AppSettingsProvider>
    </main>
  );
}
