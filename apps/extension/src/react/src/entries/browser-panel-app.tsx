import { BrowserPanelHeader } from '@/components/browser-panel/browser-panel-header';
import { Stopwatch } from '@/components/browser-panel/stopwatch';
import { useAppHeight } from '@/hooks/use-app-height';
import { useAppSettings } from '@/hooks/use-app-settings';
import { useSidePanelIntegration } from '@/hooks/use-side-panel-integration';
import { useStopwatch } from '@/hooks/use-stopwatch';
import { Button } from '@repo/ui/components/button';
import { ArrowLeft, ArrowRight } from 'lucide-react';
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

  const { isSidePanelOpen, toggleSidePanel } = useSidePanelIntegration();

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

          {appMode !== 'focus' && (
            <div className="w-full">
              <Button
                variant="outline"
                className="w-full justify-center bg-background text-foreground"
                onClick={toggleSidePanel}
              >
                {isSidePanelOpen ? 'Close Details' : 'See Details'}
                {isSidePanelOpen ? (
                  <ArrowLeft className="h-4 w-4 ml-2" />
                ) : (
                  <ArrowRight className="h-4 w-4 ml-2" />
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
