import { CalendarDayBody } from '@/components/side-panel/calendar/calendar-day-body';
import { ScheduleItemDrawer } from '@/components/side-panel/calendar/schedule-item-drawer';
import { WeekNavigation } from '@/components/side-panel/calendar/week-navigation';
import { useDailyCalendar } from '@/hooks/use-daily-calendar';
import { generateWeekDaysFromStartDate } from '@/lib/calendar-utils';
import { ScheduleItem } from '@repo/shared/types/schedule';
import { Tabs } from '@repo/ui/components/tabs';
import { format, parseISO, startOfWeek } from 'date-fns';

export function DailyCalendar() {
  const {
    selectedDay: [selectedDay, setSelectedDay],
    weekStartDate: [weekStartDate, setWeekStartDate],
    openScheduleItem: [openScheduleItem, setOpenScheduleItem],
    drawerOpen: [drawerOpen, setDrawerOpen],
    currentTimePosition: [currentTimePosition],
    scheduleItems: {
      validScheduleItems,
      isLoadingScheduleItems,
      scheduleItemsError,
    },
    tabsListRef,
  } = useDailyCalendar();

  // Generate week days starting from current week
  const weekDays = generateWeekDaysFromStartDate(weekStartDate);

  const handleItemClick = (item: ScheduleItem) => {
    setOpenScheduleItem(item);
    setDrawerOpen(true);
  };

  const handleDateChange = (date: Date) => {
    setSelectedDay(date);
    setWeekStartDate(startOfWeek(date, { weekStartsOn: 1 }));
  };

  // Show loading state
  if (isLoadingScheduleItems) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-muted-foreground">Loading schedule...</div>
      </div>
    );
  }

  // Show error state
  if (scheduleItemsError) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="text-destructive">Failed to load schedule</div>
      </div>
    );
  }

  return (
    <section className="w-full h-full max-h-[calc(100vh-120px)] bg-background overflow-y-auto">
      <Tabs
        value={format(selectedDay, 'yyyy-MM-dd')}
        onValueChange={(newDateString) =>
          handleDateChange(parseISO(newDateString))
        }
        className="w-full relative"
      >
        {/* Includes TabsList */}
        <WeekNavigation
          date={selectedDay}
          onDateChange={handleDateChange}
          weekDays={weekDays}
          tabsListRef={tabsListRef}
        />

        {/* Includes TabsContent */}
        <CalendarDayBody
          weekDays={weekDays}
          validScheduleItems={validScheduleItems}
          onScheduleItemClick={handleItemClick}
          currentTimePosition={currentTimePosition}
        />
      </Tabs>

      <ScheduleItemDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        openScheduleItem={openScheduleItem}
      />
    </section>
  );
}
