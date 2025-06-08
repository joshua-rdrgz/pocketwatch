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
import { addDays, format, parseISO, startOfWeek } from 'date-fns';
import { useState, useRef, useEffect } from 'react';

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

interface DailyCalendarProps {
  events: Event[];
}

// Calculate event position and height based on time
const getEventStyle = (event: Event) => {
  const startHour = parseInt(event.startTime.split(':')[0]);
  const startMinute = parseInt(event.startTime.split(':')[1]) / 60;
  const endHour = parseInt(event.endTime.split(':')[0]);
  const endMinute = parseInt(event.endTime.split(':')[1]) / 60;

  const top = (startHour + startMinute) * 60; // 60px per hour
  const height = (endHour + endMinute - startHour - startMinute) * 60;

  return {
    top: `${top}px`,
    height: `${height}px`,
  };
};

// Calculate duration display
const getDuration = (startTime: string, endTime: string) => {
  const start = new Date(`2000-01-01T${startTime}`);
  const end = new Date(`2000-01-01T${endTime}`);
  const diffMs = end.getTime() - start.getTime();
  const diffMins = diffMs / (1000 * 60);

  if (diffMins < 60) {
    return `${diffMins}m`;
  } else {
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
};

// Get current time line position
const getCurrentTimePosition = () => {
  const now = new Date();
  const hours = now.getHours();
  const minutes = now.getMinutes();
  return (hours + minutes / 60) * 60;
};

export function DailyCalendar({ events }: DailyCalendarProps) {
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [openEvent, setOpenEvent] = useState<Event | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentTimePosition, setCurrentTimePosition] = useState(
    getCurrentTimePosition()
  );
  const tabsListRef = useRef<HTMLDivElement>(null);

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
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
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

  const handleEventClick = (event: Event) => {
    setOpenEvent(event);
    setDrawerOpen(true);
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return format(date, 'yyyy-MM-dd') === format(today, 'yyyy-MM-dd');
  };

  return (
    <div className="w-full h-full max-h-[calc(100vh-120px)] bg-background overflow-y-auto">
      <Tabs
        defaultValue={format(selectedDay, 'yyyy-MM-dd')}
        onValueChange={(value) => setSelectedDay(parseISO(value))}
        className="w-full relative"
      >
        <div className="flex bg-background border-b border-border sticky top-0 z-30">
          {/* Month/Year section - hidden on mobile */}
          <div className="hidden min-[320px]:block p-4 text-center">
            <div className="text-sm min-[475px]:text-lg font-medium text-muted-foreground">
              {format(weekStart, 'yyyy')}
            </div>
            <div className="text-base min-[475px]:text-xl font-semibold text-foreground">
              {format(weekStart, 'MMM')}
            </div>
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
                  isToday(selectedDay)
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

                  {/* Events */}
                  {events
                    .filter((event) => event.date === format(day, 'yyyy-MM-dd'))
                    .map((event) => (
                      <div
                        key={event.id}
                        className="absolute left-2 right-2 cursor-pointer rounded-lg border border-border px-3 py-2 shadow-sm hover:shadow-md transition-shadow bg-primary text-primary-foreground"
                        style={getEventStyle(event)}
                        onClick={() => handleEventClick(event)}
                      >
                        <div className="flex justify-between items-start h-full">
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm leading-tight">
                              {event.title}
                            </div>
                          </div>
                          <div className="text-xs ml-2 font-medium">
                            {getDuration(event.startTime, event.endTime)}
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

      {/* Event Details Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          {openEvent && (
            <>
              <DrawerHeader>
                <DrawerTitle>{openEvent.title}</DrawerTitle>
                <DrawerDescription>
                  {format(parseISO(openEvent.date), 'EEEE, MMMM d, yyyy')}
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4 py-2 space-y-4">
                <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
                  <div className="font-medium text-foreground">Time:</div>
                  <div className="text-foreground">
                    {openEvent.startTime} - {openEvent.endTime}
                  </div>

                  <div className="font-medium text-foreground">Location:</div>
                  <div className="text-foreground">{openEvent.location}</div>

                  <div className="font-medium text-foreground">Category:</div>
                  <div className="text-foreground">{openEvent.category}</div>

                  <div className="font-medium text-foreground">
                    Description:
                  </div>
                  <div className="text-foreground">{openEvent.description}</div>

                  {openEvent.attendees.length > 0 && (
                    <>
                      <div className="font-medium text-foreground">
                        Attendees:
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {openEvent.attendees.map((attendee, index) => (
                          <span
                            key={index}
                            className="bg-muted text-muted-foreground px-2 py-1 rounded-full text-xs"
                          >
                            {attendee}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
              <DrawerFooter>
                <DrawerClose className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-md px-4 py-2">
                  Close
                </DrawerClose>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
