import { useDashStore } from '@/stores/dash-store';
import { formatTime } from '@/lib/utils';

export function StopwatchStats() {
  const timers = useDashStore((state) => state.timers);
  const wsConnectionStatus = useDashStore((state) => state.wsConnectionStatus);
  const wsRetryState = useDashStore((state) => state.wsRetryState);

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
    </div>
  );
}
