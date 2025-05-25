import { useAppSettings } from '@/hooks/use-app-settings';
import { useStopwatch } from '@/hooks/use-stopwatch';
import { formatTime } from '@/lib/utils';
import { useMemo } from 'react';

export function StopwatchStats() {
  const { timers } = useStopwatch();
  const { hourlyRate, projectName } = useAppSettings();

  const earnings = useMemo(
    () => ((timers.work / 3600000) * hourlyRate).toFixed(2),
    [timers.work, hourlyRate]
  );

  return (
    <div className="flex-1 p-2 flex flex-col gap-1">
      <div className="font-mono text-2xl">{formatTime(timers.work)}</div>
      <div className="text-xs text-muted-foreground">${earnings} earned</div>
      <div className="text-sm text-muted-foreground">
        {projectName || 'No Project Entered'}
      </div>
    </div>
  );
}
