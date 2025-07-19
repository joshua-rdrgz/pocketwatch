import {
  getScheduleItemDuration,
  getScheduleItemPosition,
  TIME_SLOTS,
} from '@/lib/calendar-utils';
import { ScheduleItem } from '@repo/shared/types/schedule';
import { Badge } from '@repo/ui/components/badge';
import { TabsContent } from '@repo/ui/components/tabs';
import { format, isToday } from 'date-fns';

interface CalendarDayBodyProps {
  weekDays: Date[];
  validScheduleItems: ScheduleItem[];
  onScheduleItemClick(item: ScheduleItem): void;
  currentTimePosition: number;
}

export function CalendarDayBody({
  weekDays,
  validScheduleItems,
  onScheduleItemClick,
  currentTimePosition,
}: CalendarDayBodyProps) {
  return (
    <>
      {/* TAB CONTENT RENDERING */}
      {weekDays.map((day) => (
        <TabsContent
          key={format(day, 'yyyy-MM-dd')}
          value={format(day, 'yyyy-MM-dd')}
          className="m-0"
        >
          <div className="bg-card">
            <div className="relative">
              {/* Time slots */}
              <div className="absolute left-0 top-0 w-12 min-[475px]:w-20 bg-card z-10">
                {TIME_SLOTS.map((time, index) => (
                  <div
                    key={time}
                    className="h-[60px] flex items-start justify-end pr-1 min-[475px]:pr-3 pt-1 text-xs min-[475px]:text-sm text-muted-foreground font-medium"
                  >
                    {index > 0 && time}
                  </div>
                ))}
              </div>

              {/* Events container */}
              <div className="ml-12 min-[475px]:ml-20 relative border-l border-border">
                {/* Hour grid lines */}
                {TIME_SLOTS.map((time) => (
                  <div
                    key={time}
                    className="h-[60px] border-b border-border w-full"
                  />
                ))}

                {/* Current time indicator */}
                {isToday(day) && (
                  <div
                    className="absolute left-0 right-0 border-t-2 border-destructive z-20"
                    style={{ top: `${currentTimePosition}px` }}
                  >
                    <div className="w-3 h-3 bg-destructive rounded-full absolute -left-1.5 -top-1.5"></div>
                  </div>
                )}

                {/* Schedule Items */}
                {validScheduleItems
                  // Only show items for the current day
                  .filter((item) => {
                    // Skip if no start time
                    if (!item.scheduledStart) return false;
                    // Get item's date
                    const itemDate = format(
                      new Date(item.scheduledStart),
                      'yyyy-MM-dd'
                    );
                    // Match with current day
                    return itemDate === format(day, 'yyyy-MM-dd');
                  })
                  .map((item) => {
                    // scheduledStart exists; check scheduledEnd
                    const scheduledStart = item.scheduledStart!;
                    const scheduledEnd = item.scheduledEnd;

                    // Skip if no end time
                    if (!scheduledEnd) return null;

                    return (
                      <div
                        key={item.id}
                        className="absolute left-2 right-2 cursor-pointer rounded-lg border border-primary px-3 py-2 shadow-sm hover:shadow-md transition-shadow bg-primary text-primary-foreground hover:bg-primary/90"
                        style={getScheduleItemPosition(
                          scheduledStart,
                          scheduledEnd
                        )}
                        onClick={() => onScheduleItemClick(item)}
                      >
                        <div className="flex justify-between items-start h-full">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm leading-tight mb-1">
                              {item.name}
                            </div>
                            <div className="flex items-center gap-1">
                              <Badge variant="secondary" className="text-xs">
                                {item.type === 'task' ? 'Task' : 'Subtask'}
                              </Badge>
                              {item.isBillable && (
                                <Badge
                                  variant="outline"
                                  className="text-xs bg-accent/90 text-accent-foreground border-accent"
                                >
                                  Billable
                                </Badge>
                              )}
                            </div>
                          </div>
                          <div className="text-xs ml-2 font-medium">
                            {getScheduleItemDuration(
                              scheduledStart,
                              scheduledEnd
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </TabsContent>
      ))}
    </>
  );
}
