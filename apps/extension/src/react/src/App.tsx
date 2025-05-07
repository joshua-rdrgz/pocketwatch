import { PanelHeader } from '@/components/panel-header';
import { RecapDialog } from '@/components/recap-dialog';
import { Stopwatch } from '@/components/stopwatch';
import { useAppHeight } from '@/hooks/use-app-height';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useStopwatch } from '@/hooks/use-stopwatch';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { useMemo, useState } from 'react';

export default function App() {
  const {
    appMode,
    hourlyRate,
    events,
    handleAppModeChange,
    handleHourlyRateChange,
    logEvent,
    clearEvents,
  } = useAppSettings();

  const {
    timers,
    currStopwatchMode,
    handleStopwatchStart,
    handleStopwatchStop,
    setStopwatchMode,
    resetStopwatch,
  } = useStopwatch();

  const [showFinalResultsDialog, setShowFinalResultsDialog] = useState(false);

  // Make React height sync with vanillaJS container height
  useAppHeight({ appMode });

  const earnings = useMemo(
    () => ((timers.work / 3600000) * hourlyRate).toFixed(2),
    [timers.work, hourlyRate]
  );

  const handleStart = () => {
    logEvent(timers.total === 0 ? 'start' : 'resume');
    setStopwatchMode('work');
    if (timers.total === 0) {
      handleStopwatchStart();
    }
  };

  const handleBreak = (isExtendedBreak: boolean = false) => {
    logEvent(isExtendedBreak ? 'extended_break' : 'break');
    const mode = isExtendedBreak ? 'extBreak' : 'break';
    setStopwatchMode(mode);
  };

  const handleFinish = () => {
    setStopwatchMode(null);
    handleStopwatchStop();
    logEvent('finish');
    setShowFinalResultsDialog(true);
  };

  return (
    <main className="w-full">
      <div id="app-content" className="w-full p-6">
        <div className="w-full max-w-md mx-auto space-y-6">
          <PanelHeader
            appMode={appMode}
            onAppModeChange={handleAppModeChange}
          />

          <Stopwatch
            mode={appMode}
            earnings={earnings}
            timers={timers}
            currStopwatchMode={currStopwatchMode}
            onStart={handleStart}
            onBreak={() => handleBreak(false)}
            onExtendedBreak={() => handleBreak(true)}
            onFinish={handleFinish}
          />

          {appMode !== 'focus' && (
            <div className="space-y-2">
              <Label htmlFor="hourly-rate" className="text-foreground">
                Hourly Rate ($)
              </Label>
              <Input
                id="hourly-rate"
                type="number"
                value={hourlyRate}
                onChange={(e) => {
                  handleHourlyRateChange(Number(e.target.value));
                }}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>

      <RecapDialog
        open={showFinalResultsDialog}
        onOpenChange={(open) => setShowFinalResultsDialog(open)}
        timers={timers}
        earnings={earnings}
        events={events}
        onNewSession={() => {
          setShowFinalResultsDialog(false);
          clearEvents();
          resetStopwatch();
        }}
      />
    </main>
  );
}
