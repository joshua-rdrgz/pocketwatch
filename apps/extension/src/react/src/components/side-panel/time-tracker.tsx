import { useAppSettings } from '@/hooks/use-app-settings';
import { useStopwatch } from '@/hooks/use-stopwatch';
import { formatTime } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { useMemo } from 'react';

export function TimeTracker() {
  const { timers } = useStopwatch();
  const { hourlyRate } = useAppSettings();

  const earnings = useMemo(
    () => ((timers.work / 3600000) * hourlyRate).toFixed(2),
    [timers.work, hourlyRate]
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Time Tracking</CardTitle>
        <CardDescription>
          Monitor work and break times in real-time. Maintain a healthy
          work-life balance with clear time distribution insights.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {timers.total > 0 ? (
            <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
              <div className="flex flex-col space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Work Time
                  </span>
                  <span className="text-foreground font-semibold">
                    {formatTime(timers.work)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Break Time
                  </span>
                  <span className="text-foreground font-semibold">
                    {formatTime(timers.break)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total Time
                  </span>
                  <span className="text-foreground font-semibold">
                    {formatTime(timers.total)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 mt-2 rounded-lg bg-primary/10 border border-primary/20">
                  <span className="font-medium">Total Earnings</span>
                  <span className="text-primary font-bold text-lg">
                    ${earnings}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-6 text-center rounded-lg bg-muted/30">
              <div className="mb-2 text-4xl">⏱️</div>
              <h3 className="text-lg font-medium mb-1">
                No time tracked yet...
              </h3>
              <p className="text-muted-foreground">
                Start tracking your time in the browser panel!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
