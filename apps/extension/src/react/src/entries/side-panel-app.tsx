import { EventTimeline } from '@/components/side-panel/event-timeline';
import { SessionSettings } from '@/components/side-panel/session-settings';
import { SidePanelHeader } from '@/components/side-panel/side-panel-header';
import { TimeTracker } from '@/components/side-panel/time-tracker';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useSidePanelSetup } from '@/hooks/use-side-panel-setup';
import { useStopwatch } from '@/hooks/use-stopwatch';
import { useMemo } from 'react';

export default function SidePanelApp() {
  const {
    hourlyRate,
    handleHourlyRateChange,
    projectName,
    handleProjectNameChange,
    projectDescription,
    handleProjectDescriptionChange,
    events,
  } = useAppSettings();
  const { timers } = useStopwatch();

  useSidePanelSetup();

  const earnings = useMemo(
    () => ((timers.work / 3600000) * hourlyRate).toFixed(2),
    [timers.work, hourlyRate]
  );

  return (
    <main className="bg-background w-full min-h-svh p-6 flex flex-col gap-6 text-container">
      <SidePanelHeader />
      <SessionSettings
        hourlyRate={hourlyRate}
        onHourlyRateChange={handleHourlyRateChange}
        projectName={projectName}
        onProjectNameChange={handleProjectNameChange}
        projectDescription={projectDescription}
        onProjectDescriptionChange={handleProjectDescriptionChange}
      />
      <EventTimeline events={events} />
      <TimeTracker timers={timers} earnings={earnings} />
    </main>
  );
}
