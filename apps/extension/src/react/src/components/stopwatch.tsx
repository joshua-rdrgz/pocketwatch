import { formatTime } from '@/lib/utils';
import { AppMode } from '@/types/app';
import { StopwatchMode, StopwatchTimers } from '@/types/stopwatch';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';

interface StopwatchProps {
  mode: AppMode;
  earnings: string;
  timers: StopwatchTimers;
  currStopwatchMode: StopwatchMode;
  onStart(): void;
  onBreak(): void;
  onExtendedBreak(): void;
  onFinish(): void;
}

export function Stopwatch({
  mode,
  earnings,
  timers,
  currStopwatchMode,
  onStart,
  onBreak,
  onExtendedBreak,
  onFinish,
}: StopwatchProps) {
  return (
    <>
      {mode === 'focus' ? (
        <div className="text-center">
          <div className="text-xl font-mono text-gray-500 animate-pulse">
            {currStopwatchMode === 'work'
              ? 'Shh... Focusing...'
              : timers.total === 0
                ? 'Time to start!'
                : 'Break time!'}
          </div>
        </div>
      ) : (
        <>
          <div className="text-center">
            <div className="text-2xl font-mono">{formatTime(timers.work)}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Earnings: ${earnings}
            </div>
          </div>
          {mode === 'stats' && (
            <Card className="bg-gradient-to-br from-background/50 to-background/90 gap-3 border-muted-foreground/30 shadow-md p-4 rounded-lg w-full max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-center text-muted-foreground/90">
                  Timer Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {(
                    [
                      {
                        type: 'work' as const,
                        label: 'Work',
                      },
                      {
                        type: 'break' as const,
                        label: 'Break',
                      },
                      {
                        type: 'extBreak' as const,
                        label: 'Ext. Breaks',
                      },
                      {
                        type: 'total' as const,
                        label: 'Total',
                      },
                    ] as { type: StopwatchMode; label: string }[]
                  ).map(({ type, label }) => (
                    <div className="flex flex-col items-center">
                      <span className="text-sm text-muted-foreground/60 font-medium">
                        {label}
                      </span>
                      <span className="text-base text-foreground/90 font-mono">
                        {formatTime(timers[type!])}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
      <div className="flex flex-wrap gap-2 justify-center">
        {currStopwatchMode === 'work' ? (
          <>
            <Button variant="outline" onClick={onBreak}>
              Break
            </Button>

            <Button variant="outline" onClick={onExtendedBreak}>
              Ext. Break
            </Button>

            <Button variant="destructive" onClick={onFinish}>
              Finish
            </Button>
          </>
        ) : (
          <Button onClick={onStart}>
            {timers.total > 0 ? 'Resume' : 'Start'}
          </Button>
        )}
      </div>
    </>
  );
}
