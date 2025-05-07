import { BrowserPanelHeader } from '@/components/browser-panel/browser-panel-header';
import { Stopwatch } from '@/components/browser-panel/stopwatch';
import { useAppHeight } from '@/hooks/use-app-height';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useStopwatch } from '@/hooks/use-stopwatch';
import { useMemo } from 'react';

export default function BrowserPanelApp() {
  const { appMode, hourlyRate, handleAppModeChange, logEvent } =
    useAppSettings();

  const {
    timers,
    currStopwatchMode,
    handleStopwatchStart,
    handleStopwatchStop,
    setStopwatchMode,
  } = useStopwatch();

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
  };

  return (
    <main className="w-full">
      <div id="app-content" className="w-full p-6">
        <div className="w-full max-w-md mx-auto space-y-6">
          <BrowserPanelHeader
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
        </div>
      </div>
    </main>
  );
}
