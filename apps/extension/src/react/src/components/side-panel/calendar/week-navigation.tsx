import { DatePicker } from '@repo/ui/components/date-picker';
import { TabsList, TabsTrigger } from '@repo/ui/components/tabs';
import { format, isToday } from 'date-fns';

interface WeekNavigationProps {
  date: Date;
  onDateChange(date: Date): void;
  weekDays: Date[];
  tabsListRef: React.RefObject<HTMLDivElement | null>;
}

export function WeekNavigation({
  date,
  onDateChange,
  weekDays,
  tabsListRef,
}: WeekNavigationProps) {
  return (
    <div className="flex flex-col min-[475px]:flex-row bg-background border-b border-border sticky top-0 z-30">
      <div className="w-full min-[475px]:w-auto p-2 min-[475px]:p-4 text-center">
        {/* SELECT WEEK VIA DATE PICKER */}
        <DatePicker
          date={date}
          onDateChange={onDateChange}
          trigger={({ year, monthFull, monthShort }) => (
            <div
              className="cursor-pointer hover:bg-accent rounded-md p-2 transition-colors"
              data-testid="date-picker-trigger"
            >
              {/* Mobile layout: single line */}
              <div className="min-[475px]:hidden text-base font-semibold text-foreground">
                {year} {monthFull}
              </div>
              {/* Desktop layout: two lines */}
              <div className="hidden min-[475px]:block">
                <div className="text-sm min-[475px]:text-lg font-medium text-muted-foreground">
                  {year}
                </div>
                <div className="text-base min-[475px]:text-xl font-semibold text-foreground">
                  {monthShort}
                </div>
              </div>
            </div>
          )}
        />
      </div>
      {/* RENDERING WEEK */}
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
  );
}
