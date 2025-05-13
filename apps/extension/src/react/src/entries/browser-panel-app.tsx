import { StopwatchActions } from '@/components/browser-panel/stopwatch-actions';
import { StopwatchStats } from '@/components/browser-panel/stopwatch-stats';
import { useAppHeight } from '@/hooks/use-app-height';
import { useState } from 'react';

export default function BrowserPanelApp() {
  // Make React height sync with vanillaJS container height
  useAppHeight();

  // const earnings = useMemo(
  //   () => ((timers.work / 3600000) * hourlyRate).toFixed(2),
  //   [timers.work, hourlyRate]
  // );

  // const handleStart = () => {
  //   logEvent(timers.total === 0 ? 'start' : 'resume');
  //   setStopwatchMode('work');
  //   if (timers.total === 0) {
  //     handleStopwatchStart();
  //   }
  // };

  // const handleBreak = (isExtendedBreak: boolean = false) => {
  //   logEvent(isExtendedBreak ? 'extended_break' : 'break');
  //   const mode = isExtendedBreak ? 'extBreak' : 'break';
  //   setStopwatchMode(mode);
  // };

  // const handleFinish = () => {
  //   setStopwatchMode(null);
  //   handleStopwatchStop();
  //   logEvent('finish');
  // };

  const [primaryBtnHovered, setPrimaryBtnHovered] = useState(false);

  return (
    <main
      className={`w-full min-h-svh overflow-hidden ${primaryBtnHovered ? 'bg-gradient-to-r from-transparent to-black/75' : ''}`}
    >
      <div id="panel-content" className="flex justify-center w-full h-full">
        {/* Left container - fills available space */}
        <StopwatchStats />

        {/* Right container - only takes required space */}
        <StopwatchActions
          primaryBtnHovered={primaryBtnHovered}
          onPrimaryBtnHovered={(isHovered) => setPrimaryBtnHovered(isHovered)}
        />
      </div>
    </main>
  );
}
