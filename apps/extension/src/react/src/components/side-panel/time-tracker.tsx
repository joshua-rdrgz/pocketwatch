import { useStopwatch } from '@/hooks/use-stopwatch';
import { formatTime } from '@/lib/utils';
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
import { Timer } from 'lucide-react';

export function TimeTracker() {
  const { timers } = useStopwatch();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Time Distribution</CardTitle>
        <CardDescription>
          Breakdown of your work and break times for this session
        </CardDescription>
      </CardHeader>
      <CardContent>
        {timers.total > 0 ? (
          <div className="overflow-hidden rounded-lg border">
            <Table className="min-w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Activity</TableHead>
                  <TableHead className="text-xs text-right text-muted-foreground hidden min-[350px]:table-cell">
                    Percentage
                  </TableHead>
                  <TableHead className="text-xs text-right">Duration</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell className="font-medium">Work Time</TableCell>
                  <TableCell className="text-right text-muted-foreground hidden min-[350px]:table-cell">
                    {Math.round((timers.work / timers.total) * 100)}%
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatTime(timers.work)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Break Time</TableCell>
                  <TableCell className="text-right text-muted-foreground hidden min-[350px]:table-cell">
                    {Math.round((timers.break / timers.total) * 100)}%
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    {formatTime(timers.break)}
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell className="font-medium">Total Time</TableCell>
                  <TableCell className="text-right text-muted-foreground hidden min-[350px]:table-cell">
                    100%
                  </TableCell>
                  <TableCell className="text-right font-bold">
                    {formatTime(timers.total)}
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border">
            <Table>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={3} className="p-6 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <Timer className="mb-2 h-10 w-10 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-1">
                        No time tracked yet...
                      </h3>
                      <p className="text-muted-foreground">
                        Start tracking your time in the browser panel!
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
