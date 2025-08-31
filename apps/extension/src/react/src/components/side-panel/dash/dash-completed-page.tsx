import { useDashStore } from '@/stores/dash-store';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@repo/ui/components/table';
import { Button } from '@repo/ui/components/button';
import { Coffee, Globe, CheckCircle, Timer } from 'lucide-react';
import { useMemo } from 'react';
import { formatTime } from '@/lib/utils';

export function DashCompletedPage() {
  const events = useDashStore((state) => state.events);
  const timers = useDashStore((state) => state.timers);
  const completeDash = useDashStore((state) => state.completeDash);

  // Calculate dash analytics
  const breaksTaken = useMemo(() => {
    return events.filter(
      (event) => event.type === 'stopwatch' && event.action === 'break'
    ).length;
  }, [events]);

  // Hardcoded website metrics (same as DashAnalytics)
  const forbiddenWebsitesVisited = 3;
  const totalWebsitesVisited = 15;

  const handleFinishDash = () => {
    completeDash();
  };

  return (
    <div className="space-y-6">
      {/* Dash Summary Header */}
      <Card>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
          <CardTitle className="text-xl">Dash Complete</CardTitle>
          <CardDescription>
            Review your dash summary before finalizing
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Dash Analytics Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dash Analytics</CardTitle>
          <CardDescription>
            Summary of your activity during this dash
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Breaks Card */}
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <Coffee className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm font-medium">Breaks Taken</p>
                <p className="text-2xl font-bold">{breaksTaken}</p>
              </div>
            </div>

            {/* Website Activity Card */}
            <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
              <Globe className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-sm font-medium">Website Activity</p>
                <p className="text-2xl font-bold">
                  <span className="text-red-500">
                    {forbiddenWebsitesVisited}
                  </span>
                  <span className="text-muted-foreground text-sm ml-1">
                    / {totalWebsitesVisited}
                  </span>
                </p>
                <p className="text-xs text-muted-foreground">
                  Forbidden vs total sites
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Time Distribution Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Time Distribution</CardTitle>
          <CardDescription>
            Breakdown of your work and break times
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timers.total > 0 ? (
            <div className="overflow-hidden rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Activity</TableHead>
                    <TableHead className="text-right">Percentage</TableHead>
                    <TableHead className="text-right">Duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium">Work Time</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {Math.round((timers.work / timers.total) * 100)}%
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatTime(timers.work)}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Break Time</TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {Math.round((timers.break / timers.total) * 100)}%
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {formatTime(timers.break)}
                    </TableCell>
                  </TableRow>
                  <TableRow className="border-t-2">
                    <TableCell className="font-bold">Total Time</TableCell>
                    <TableCell className="text-right font-bold">100%</TableCell>
                    <TableCell className="text-right font-bold text-lg">
                      {formatTime(timers.total)}
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-6">
              <Timer className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-muted-foreground">No time was tracked</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Final Action Button */}
      <Card>
        <CardContent className="pt-6">
          <Button onClick={handleFinishDash} className="w-full" size="lg">
            <CheckCircle className="h-4 w-4 mr-2" />
            Finish Dash
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            This will finalize your dash and save all data
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
