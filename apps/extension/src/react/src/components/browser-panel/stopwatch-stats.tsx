import { useSessionStore } from '@/stores/session-store';
import { formatTime } from '@/lib/utils';

export function StopwatchStats() {
  const timers = useSessionStore((state) => state.timers);
  const wsConnectionStatus = useSessionStore(
    (state) => state.wsConnectionStatus
  );
  const wsRetryState = useSessionStore((state) => state.wsRetryState);

  return (
    <div className="flex-1 p-2 flex flex-col gap-1">
      <div className="font-mono text-2xl">{formatTime(timers.work)}</div>
      <div className="flex items-center gap-1">
        {wsConnectionStatus === 'not_connected' ? (
          <>
            <div className="w-2 h-2 rounded-full bg-red-500" />
            <div className="text-sm">
              {wsRetryState.isReconnecting
                ? `Reconnecting... (${wsRetryState.currentAttempt})`
                : 'Not connected!'}
            </div>
          </>
        ) : (
          <>
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <div className="text-sm">Connected!</div>
          </>
        )}
      </div>
      {/* TODO: replace with stats from Task resource */}
      {/* <div className="text-xs text-muted-foreground">${earnings} earned</div>
      <div className="text-sm text-muted-foreground">
        {projectName || 'No Project Entered'}
      </div> */}
    </div>
  );
}
