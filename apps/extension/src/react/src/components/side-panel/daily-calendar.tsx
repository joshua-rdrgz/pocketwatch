import { DatePicker } from '@repo/ui/components/date-picker';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@repo/ui/components/drawer';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs';
import { Badge } from '@repo/ui/components/badge';
import { Button } from '@repo/ui/components/button';
import { FileText, Hash, Link, Clock } from 'lucide-react';
import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router';
import { useSchedule } from '@/hooks/schedule';
import { ScheduleItem } from '@repo/shared/types/schedule';

// Keep the Event interface for backward compatibility
export interface Event {
  id: string;
  title: string;
  startTime: string;
  endTime: string;
  date: string;
  description: string;
  location: string;
  attendees: string[];
  category: string;
  color?: string;
}

// Calculate event position and height based on time for ScheduleItem
const getScheduleItemStyle = (item: ScheduleItem) => {
  if (!item.scheduledStart || !item.scheduledEnd) {
    return { top: '0px', height: '60px' };
  }

  const startDate = new Date(item.scheduledStart);
  const endDate = new Date(item.scheduledEnd);

  const startHour = startDate.getHours();
  const startMinute = startDate.getMinutes() / 60;
  const endHour = endDate.getHours();
  const endMinute = endDate.getMinutes() / 60;

  const top = (startHour + startMinute) * 60; // 60px per hour
  const height = (endHour + endMinute - startHour - startMinute) * 60;

  return {
    top: `${top}px`,
    height: `${height}px`,
  };
};

// Calculate duration display for ScheduleItem
const getScheduleItemDuration = (item: ScheduleItem) => {
  if (!item.scheduledStart || !item.scheduledEnd) {
    return '';
  }

  // Parse dates - handle both ISO strings and Date objects
  const start = new Date(item.scheduledStart);
  const end = new Date(item.scheduledEnd);

  // Validate dates
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return '';
  }

  // Calculate difference in milliseconds
  const diffMs = end.getTime() - start.getTime();

  // If negative duration, return empty
  if (diffMs <= 0) {
    return '';
  }

  // Convert to total seconds first to avoid floating point issues
  const totalSeconds = Math.floor(diffMs / 1000);

  // Convert to total minutes
  const totalMinutes = Math.floor(totalSeconds / 60);

  if (totalMinutes < 60) {
    return `${totalMinutes}m`;
  }

  // Calculate hours and remaining minutes using integer division
  const hours = Math.floor(totalMinutes / 60);
  const remainingMinutes = totalMinutes - hours * 60;

  // Return format based on whether there are remaining minutes
  if (remainingMinutes === 0) {
    return `${hours}h`;
  } else {
    return `${hours}h ${remainingMinutes}m`;
  }
};

// Get current time line position
const getCurrentTimePosition = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return (hours + minutes / 60) * 60;
};

export function DailyCalendar() {
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [weekStart, setWeekStart] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [openItem, setOpenItem] = useState<ScheduleItem | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentTimePosition, setCurrentTimePosition] = useState(
    getCurrentTimePosition()
  );
  const tabsListRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Fetch schedule data for the selected week
  const { data: scheduleItems, isLoading, error } = useSchedule(selectedDay);

  // Filter schedule items to only show those with both start and end times
  const validScheduleItems =
    scheduleItems?.filter((item) => item.scheduledStart && item.scheduledEnd) ||
    [];

  useEffect(() => {
    const measureHeight = () => {
      if (tabsListRef.current) {
        // Measure height for potential future use
        const height = tabsListRef.current.offsetHeight;
        console.log('Tabs list height:', height);
      }
    };

    measureHeight();

    window.addEventListener('resize', measureHeight);
    return () => window.removeEventListener('resize', measureHeight);
  }, []);

  // Update current time position every minute
  useEffect(() => {
    const updateCurrentTime = () => {
      setCurrentTimePosition(getCurrentTimePosition());
    };

    const interval = setInterval(updateCurrentTime, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  // Generate week days starting from current week
  const weekDays = Array.from({ length: 7 }).map((_, i) =>
    addDays(weekStart, i)
  );

  // Generate time slots for the day (24 hours)
  const timeSlots = Array.from({ length: 24 }).map((_, i) => {
    const hour = i;
    if (hour === 0) return '12 AM';
    if (hour < 12) return `${hour} AM`;
    if (hour === 12) return '12 PM';
    return `${hour - 12} PM`;
  });

  const handleItemClick = (item: ScheduleItem) => {
    setOpenItem(item);
    setDrawerOpen(true);
  };

  const handleViewEvent = () => {
    if (!openItem) return;

    let taskId: string;
    if (openItem.type === 'task') {
      taskId = openItem.id;
    } else {
      taskId = openItem.taskId;
    }

    const projectId = openItem.projectId;

    if (projectId && taskId) {
      navigate(`/projects/${projectId}/tasks/${taskId}`);
      setDrawerOpen(false);
    }
  };

  const handleDateChange = (date: Date) => {
    setSelectedDay(date);
    setWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading schedule...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-destructive">Failed to load schedule</div>
      </div>
    );
  }

  return (
    <div className="w-full h-full max-h-[calc(100vh-120px)] bg-background overflow-y-auto">
      <Tabs
        value={format(selectedDay, 'yyyy-MM-dd')}
        onValueChange={(value) => {
          const newDate = parseISO(value);
          setSelectedDay(newDate);
          setWeekStart(startOfWeek(newDate, { weekStartsOn: 1 }));
        }}
        className="w-full relative"
      >
        <div className="flex flex-col min-[475px]:flex-row bg-background border-b border-border sticky top-0 z-30">
          {/* Combined responsive date picker */}
          <div className="w-full min-[475px]:w-auto p-2 min-[475px]:p-4 text-center">
            <DatePicker
              date={selectedDay}
              onDateChange={handleDateChange}
              trigger={
                <div
                  className="cursor-pointer hover:bg-accent rounded-md p-2 transition-colors"
                  data-testid="date-picker-trigger"
                >
                  {/* Mobile layout: single line */}
                  <div className="min-[475px]:hidden text-base font-semibold text-foreground">
                    {format(weekStart, 'yyyy')} {format(weekStart, 'MMMM')}
                  </div>
                  {/* Desktop layout: two lines */}
                  <div className="hidden min-[475px]:block">
                    <div className="text-sm min-[475px]:text-lg font-medium text-muted-foreground">
                      {format(weekStart, 'yyyy')}
                    </div>
                    <div className="text-base min-[475px]:text-xl font-semibold text-foreground">
                      {format(weekStart, 'MMM')}
                    </div>
                  </div>
                </div>
              }
            />
          </div>
          <TabsList
            ref={tabsListRef}
            className="w-full justify-between bg-transparent border-none rounded-none h-auto p-0"
          >
            {weekDays.map((day) => (
              <TabsTrigger
                key={format(day, 'yyyy-MM-dd')}
                value={format(day, 'yyyy-MM-dd')}
                className={`flex flex-col items-center p-1 min-[475px]:p-3 rounded-none border-none ${
                  isToday(day)
                    ? 'data-[state=active]:bg-primary data-[state=active]:text-primary-foreground'
                    : 'data-[state=active]:bg-muted data-[state=active]:text-muted-foreground'
                } ${
                  isToday(day) ? 'text-foreground' : 'text-muted-foreground'
                } hover:text-foreground`}
              >
                <span className="text-[10px] min-[475px]:text-xs font-medium">
                  {format(day, 'EEE')[0]}
                </span>
                <span className="text-lg min-[475px]:text-2xl font-bold">
                  {format(day, 'dd')}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

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
                  {timeSlots.map((time, index) => (
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
                  {timeSlots.map((time) => (
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
                    .filter((item) => {
                      if (!item.scheduledStart) return false;
                      const itemDate = format(
                        new Date(item.scheduledStart),
                        'yyyy-MM-dd'
                      );
                      return itemDate === format(day, 'yyyy-MM-dd');
                    })
                    .map((item) => (
                      <div
                        key={item.id}
                        className="absolute left-2 right-2 cursor-pointer rounded-lg border border-primary px-3 py-2 shadow-sm hover:shadow-md transition-shadow bg-primary text-primary-foreground hover:bg-primary/90"
                        style={getScheduleItemStyle(item)}
                        onClick={() => handleItemClick(item)}
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
                            {getScheduleItemDuration(item)}
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      {/* Schedule Item Details Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          {openItem && (
            <>
              <DrawerHeader className="border-b border-border pb-4">
                <div className="flex items-center justify-between mb-2">
                  <DrawerTitle className="text-2xl font-bold text-foreground">
                    {openItem.name}
                  </DrawerTitle>
                  <div className="flex flex-wrap gap-2">
                    <Badge
                      variant={
                        openItem.type === 'task' ? 'default' : 'secondary'
                      }
                      className="text-sm"
                    >
                      {openItem.type === 'task' ? 'Task' : 'Subtask'}
                    </Badge>
                    {openItem.isBillable && (
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
                  {openItem.scheduledStart &&
                    format(
                      new Date(openItem.scheduledStart),
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
                      <span className="text-sm text-muted-foreground">ID</span>
                      <code className="bg-background px-2 py-1 rounded text-xs font-mono border">
                        {openItem.id}
                      </code>
                    </div>
                    {openItem.projectId && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">
                          Project
                        </span>
                        <code className="bg-background px-2 py-1 rounded text-xs font-mono border">
                          {openItem.projectId}
                        </code>
                      </div>
                    )}
                    {openItem.type === 'subtask' &&
                      'taskId' in openItem &&
                      openItem.taskId && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground flex items-center gap-1">
                            <Link className="w-3 h-3" />
                            Parent Task
                          </span>
                          <code className="bg-background px-2 py-1 rounded text-xs font-mono border">
                            {openItem.taskId}
                          </code>
                        </div>
                      )}
                  </div>
                </div>

                {/* Time and Duration Section */}
                {openItem.scheduledStart && openItem.scheduledEnd && (
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
                          new Date(openItem.scheduledStart),
                          'EEEE, MMMM d, yyyy'
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-lg font-semibold text-foreground">
                            {format(
                              new Date(openItem.scheduledStart),
                              'h:mm a'
                            )}
                          </span>
                          <span className="text-muted-foreground">to</span>
                          <span className="text-lg font-semibold text-foreground">
                            {format(new Date(openItem.scheduledEnd), 'h:mm a')}
                          </span>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          Duration: {getScheduleItemDuration(openItem)}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Notes Section */}
                {openItem.notes && (
                  <div className="bg-muted/20 rounded-lg p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium text-foreground">
                        Notes
                      </span>
                    </div>
                    <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                      {openItem.notes}
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
                    View Event
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
    </div>
  );
}
