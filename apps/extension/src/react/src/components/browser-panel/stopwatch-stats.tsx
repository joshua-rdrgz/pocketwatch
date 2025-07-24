import { useStopwatch } from '@/hooks/use-stopwatch';
import { formatTime } from '@/lib/utils';

export function StopwatchStats() {
  const { timers } = useStopwatch();

  return (
    <div className="flex-1 p-2 flex flex-col gap-1">
      <div className="font-mono text-2xl">{formatTime(timers.work)}</div>
      {/* TODO: replace with stats from Task resource */}
      {/* <div className="text-xs text-muted-foreground">${earnings} earned</div>
      <div className="text-sm text-muted-foreground">
        {projectName || 'No Project Entered'}
      </div> */}
    </div>
  );
}
