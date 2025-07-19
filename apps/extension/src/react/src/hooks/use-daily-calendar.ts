import { useSchedule } from '@/hooks/schedule';
import { getCurrentTimePosition } from '@/lib/calendar-utils';
import { ScheduleItem } from '@repo/shared/types/schedule';
import { startOfWeek } from 'date-fns';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';

type StateTuple<T> = [T, Dispatch<SetStateAction<T>>];

interface UseDailyCalendarResult {
  selectedDay: StateTuple<Date>;
  weekStartDate: StateTuple<Date>;
  openScheduleItem: StateTuple<ScheduleItem | null>;
  drawerOpen: StateTuple<boolean>;
  currentTimePosition: StateTuple<number>;
  scheduleItems: {
    validScheduleItems: ScheduleItem[];
    isLoadingScheduleItems: boolean;
    scheduleItemsError: Error | null;
  };
  tabsListRef: React.RefObject<HTMLDivElement | null>;
}

export function useDailyCalendar(): UseDailyCalendarResult {
  // --- State Management ---
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [weekStartDate, setWeekStartDate] = useState(
    startOfWeek(new Date(), { weekStartsOn: 1 })
  );
  const [openScheduleItem, setOpenScheduleItem] = useState<ScheduleItem | null>(
    null
  );
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [currentTimePosition, setCurrentTimePosition] = useState(
    getCurrentTimePosition()
  );
  // Ref for measuring the height of the tabs list (for future UI use)
  const tabsListRef = useRef<HTMLDivElement>(null);

  // --- Data Fetching ---
  // Fetch schedule data for the selected day
  const {
    data: scheduleItems,
    isLoading: isLoadingScheduleItems,
    error: scheduleItemsError,
  } = useSchedule(selectedDay);

  // --- Data Processing ---
  // Only include schedule items with both start and end times
  const validScheduleItems =
    scheduleItems?.filter((item) => item.scheduledStart && item.scheduledEnd) ||
    [];

  // --- Effects ---
  // Measure the height of the tabs list on mount and window resize
  useEffect(() => {
    const measureHeight = () => {
      if (tabsListRef.current) {
        // For future UI layout logic
        const height = tabsListRef.current.offsetHeight;
        console.log('Tabs list height:', height);
      }
    };

    measureHeight();
    window.addEventListener('resize', measureHeight);
    return () => window.removeEventListener('resize', measureHeight);
  }, []);

  // Update the current time position every minute for real-time UI updates
  useEffect(() => {
    const updateCurrentTime = () => {
      setCurrentTimePosition(getCurrentTimePosition());
    };

    const interval = setInterval(updateCurrentTime, 60000); // 1 minute interval
    return () => clearInterval(interval);
  }, []);

  // --- Return API ---
  return {
    selectedDay: [selectedDay, setSelectedDay],
    weekStartDate: [weekStartDate, setWeekStartDate],
    openScheduleItem: [openScheduleItem, setOpenScheduleItem],
    drawerOpen: [drawerOpen, setDrawerOpen],
    currentTimePosition: [currentTimePosition, setCurrentTimePosition],
    scheduleItems: {
      validScheduleItems,
      isLoadingScheduleItems,
      scheduleItemsError,
    },
    tabsListRef,
  };
}
