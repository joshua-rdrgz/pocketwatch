import { getScheduleItemDuration } from '@/lib/calendar-utils';
import { ScheduleItem } from '@repo/shared/types/schedule';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@repo/ui/components/drawer';
import { format } from 'date-fns';
import { Clock, FileText, Hash } from 'lucide-react';
import { useNavigate } from 'react-router';

interface ScheduleItemDrawerProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  openScheduleItem: ScheduleItem | null;
}

export function ScheduleItemDrawer({
  open,
  onOpenChange,
  openScheduleItem,
}: ScheduleItemDrawerProps) {
  const navigate = useNavigate();

  const handleViewEvent = () => {
    if (!openScheduleItem) return;

    // All schedule items are now tasks
    const taskId = openScheduleItem.id;
    const projectId = openScheduleItem.projectId;

    if (projectId && taskId) {
      navigate(`/projects/${projectId}/tasks/${taskId}`);
      onOpenChange(false);
    }
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        {openScheduleItem && (
          <>
            <DrawerHeader className="border-b border-border pb-4">
              <div className="flex items-center justify-between mb-2">
                <DrawerTitle className="text-2xl font-bold text-foreground">
                  {openScheduleItem.name}
                </DrawerTitle>
                <div className="flex flex-wrap gap-2">
                  {openScheduleItem.isBillable && (
                    <Badge
                      variant="outline"
                      className="text-sm bg-accent/30 text-accent-foreground border-accent"
                    >
                      Billable
                    </Badge>
                  )}
                </div>
              </div>
              <DrawerDescription className="text-base text-muted-foreground">
                {openScheduleItem.scheduledStart &&
                  format(
                    new Date(openScheduleItem.scheduledStart),
                    'EEEE, MMMM d, yyyy'
                  )}
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 py-2 space-y-6">
              {/* IDs Section - At the top */}
              <div className="bg-muted/20 rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium text-foreground">
                    Identifiers
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Task ID
                    </span>
                    <code className="bg-background px-2 py-1 rounded text-xs font-mono border">
                      {openScheduleItem.id}
                    </code>
                  </div>
                  {openScheduleItem.projectId && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Project ID
                      </span>
                      <code className="bg-background px-2 py-1 rounded text-xs font-mono border">
                        {openScheduleItem.projectId}
                      </code>
                    </div>
                  )}
                </div>
              </div>

              {/* Time and Duration Section */}
              {openScheduleItem.scheduledStart &&
                openScheduleItem.scheduledEnd && (
                  <div className="bg-muted/20 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        Scheduled For
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">
                        {format(
                          new Date(openScheduleItem.scheduledStart),
                          'EEEE, MMMM d, yyyy'
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-foreground">
                            {format(
                              new Date(openScheduleItem.scheduledStart),
                              'h:mm a'
                            )}
                          </span>
                          <span className="text-muted-foreground">to</span>
                          <span className="text-lg font-semibold text-foreground">
                            {format(
                              new Date(openScheduleItem.scheduledEnd),
                              'h:mm a'
                            )}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Duration:{' '}
                          {getScheduleItemDuration(
                            openScheduleItem.scheduledStart,
                            openScheduleItem.scheduledEnd
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Notes Section */}
              {openScheduleItem.notes && (
                <div className="bg-muted/20 rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">
                      Notes
                    </span>
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                    {openScheduleItem.notes}
                  </p>
                </div>
              )}
            </div>
            <DrawerFooter>
              <div className="flex gap-3">
                <Button
                  onClick={handleViewEvent}
                  variant="default"
                  className="flex-1"
                >
                  View Task
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" className="flex-1">
                    Cancel
                  </Button>
                </DrawerClose>
              </div>
            </DrawerFooter>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
}
