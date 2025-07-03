import { Button } from '@repo/ui/components/button';
import { Calendar } from '@repo/ui/components/calendar';
import { FormControl } from '@repo/ui/components/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@repo/ui/components/popover';
import { ScrollArea, ScrollBar } from '@repo/ui/components/scroll-area';
import { cn } from '@repo/ui/lib/utils';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import type { ControllerRenderProps } from 'react-hook-form';

interface DateTimePickerProps extends ControllerRenderProps {
  placeholder?: string;
  disabled?: boolean;
}

export function DateTimePicker({
  placeholder = 'MM/DD/YYYY hh:mm aa',
  disabled = false,
  ...field
}: DateTimePickerProps) {
  function handleDateSelect(date: Date | undefined) {
    if (!field.onChange) return;

    if (date) {
      // If we already have a value with time, preserve the time
      if (field.value) {
        const newDate = new Date(date);
        newDate.setHours(field.value.getHours());
        newDate.setMinutes(field.value.getMinutes());
        newDate.setSeconds(field.value.getSeconds());
        field.onChange(newDate);
      } else {
        // If no existing value, set to noon by default
        const newDate = new Date(date);
        newDate.setHours(12);
        newDate.setMinutes(0);
        newDate.setSeconds(0);
        field.onChange(newDate);
      }
    } else {
      field.onChange(undefined);
    }
  }

  function handleTimeChange(
    type: 'hour' | 'minute' | 'ampm',
    timeValue: string
  ) {
    if (!field.onChange) return;

    // If no date is selected, start with today
    const currentDate = field.value || new Date();
    const newDate = new Date(currentDate);

    if (type === 'hour') {
      const hour = parseInt(timeValue, 10);
      const currentHours = newDate.getHours();
      const isPM = currentHours >= 12;

      // Convert 12-hour format to 24-hour format
      if (isPM) {
        // PM hours: 12 PM = 12, 1 PM = 13, etc.
        newDate.setHours(hour === 12 ? 12 : hour + 12);
      } else {
        // AM hours: 12 AM = 0, 1 AM = 1, etc.
        newDate.setHours(hour === 12 ? 0 : hour);
      }
    } else if (type === 'minute') {
      newDate.setMinutes(parseInt(timeValue, 10));
    } else if (type === 'ampm') {
      const hours = newDate.getHours();
      if (timeValue === 'AM' && hours >= 12) {
        newDate.setHours(hours - 12);
      } else if (timeValue === 'PM' && hours < 12) {
        newDate.setHours(hours + 12);
      }
    }

    field.onChange(newDate);
  }

  // Helper function to get 12-hour format hour
  const getDisplayHour = (date: Date) => {
    const hour = date.getHours();
    return hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <FormControl>
          <Button
            variant={'outline'}
            className={cn(
              'w-full pl-3 text-left font-normal',
              !field.value && 'text-muted-foreground'
            )}
            disabled={disabled}
          >
            {field.value ? (
              format(field.value, 'MM/dd/yyyy hh:mm aa')
            ) : (
              <span>{placeholder}</span>
            )}
            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
          </Button>
        </FormControl>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0">
        <div className="sm:flex">
          <Calendar
            mode="single"
            selected={field.value}
            onSelect={handleDateSelect}
            autoFocus
          />
          <div className="flex flex-col sm:flex-row sm:h-[300px] divide-y sm:divide-y-0 sm:divide-x">
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {Array.from({ length: 12 }, (_, i) => i + 1).map((hour) => (
                  <Button
                    key={hour}
                    size="icon"
                    variant={
                      field.value && getDisplayHour(field.value) === hour
                        ? 'default'
                        : 'ghost'
                    }
                    className="sm:w-full shrink-0 aspect-square"
                    onClick={() => handleTimeChange('hour', hour.toString())}
                  >
                    {hour}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            <ScrollArea className="w-64 sm:w-auto">
              <div className="flex sm:flex-col p-2">
                {Array.from({ length: 12 }, (_, i) => i * 5).map((minute) => (
                  <Button
                    key={minute}
                    size="icon"
                    variant={
                      field.value && field.value.getMinutes() === minute
                        ? 'default'
                        : 'ghost'
                    }
                    className="sm:w-full shrink-0 aspect-square"
                    onClick={() =>
                      handleTimeChange('minute', minute.toString())
                    }
                  >
                    {minute.toString().padStart(2, '0')}
                  </Button>
                ))}
              </div>
              <ScrollBar orientation="horizontal" className="sm:hidden" />
            </ScrollArea>
            <ScrollArea className="">
              <div className="flex sm:flex-col p-2">
                {['AM', 'PM'].map((ampm) => (
                  <Button
                    key={ampm}
                    size="icon"
                    variant={
                      field.value &&
                      ((ampm === 'AM' && field.value.getHours() < 12) ||
                        (ampm === 'PM' && field.value.getHours() >= 12))
                        ? 'default'
                        : 'ghost'
                    }
                    className="sm:w-full shrink-0 aspect-square"
                    onClick={() => handleTimeChange('ampm', ampm)}
                  >
                    {ampm}
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
