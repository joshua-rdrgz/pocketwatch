import * as React from 'react';
import { Calendar } from '@repo/ui/components/calendar';
import { Button } from '@repo/ui/components/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/popover';
import { format } from 'date-fns';

interface DatePickerProps {
  date: Date;
  onDateChange: (date: Date) => void;
  trigger?: (props: {
    year: string;
    monthFull: string;
    monthShort: string;
  }) => React.ReactNode;
  className?: string;
}

export function DatePicker({
  date,
  onDateChange,
  trigger,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      onDateChange(selectedDate);
      setOpen(false);
    }
  };

  const handleTodayClick = () => {
    onDateChange(new Date());
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {trigger ? (
          trigger({
            year: format(date, 'yyyy'),
            monthFull: format(date, 'MMMM'),
            monthShort: format(date, 'MMM'),
          })
        ) : (
          <Button
            variant="ghost"
            className={`justify-start text-left font-normal ${className}`}
          >
            {format(date, 'PPP')}
          </Button>
        )}
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="p-3">
          <Calendar
            mode="single"
            selected={date}
            onSelect={handleDateSelect}
            autoFocus
            weekStartsOn={1}
          />
          <div className="mt-3 pt-3 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={handleTodayClick}
            >
              Today
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
