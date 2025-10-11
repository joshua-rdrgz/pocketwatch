import { DashEvent, DashEventAction } from '@repo/shared/types/dash';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { Input } from '@repo/ui/components/input';
import { Button } from '@repo/ui/components/button';
import { TableCell, TableRow } from '@repo/ui/components/table';
import { Trash } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';

const ACTION_COLOR_MAP: Record<string, string> = {
  start: 'text-green-600',
  break: 'text-amber-600',
  resume: 'text-blue-600',
  finish: 'text-purple-600',
};

const ACTION_OPTIONS: { value: DashEventAction; label: string }[] = [
  { value: 'start', label: 'Start' },
  { value: 'break', label: 'Break' },
  { value: 'resume', label: 'Resume' },
  { value: 'finish', label: 'Finish' },
];

interface EditableEventRowProps {
  event: DashEvent;
  onEventChange: (
    updates: Partial<Pick<DashEvent, 'action' | 'timestamp'>>
  ) => void;
  onDelete: () => void;
}

export function EditableEventRow({
  event,
  onEventChange,
  onDelete,
}: EditableEventRowProps) {
  const [isEditingTime, setIsEditingTime] = useState(false);
  const [tempTimeValue, setTempTimeValue] = useState('');

  const handleActionChange = (newAction: DashEventAction) => {
    onEventChange({ action: newAction });
  };

  const handleTimeClick = () => {
    const timeString = new Date(event.timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    setTempTimeValue(timeString);
    setIsEditingTime(true);
  };

  const handleTimeSubmit = () => {
    try {
      const [hours, minutes, seconds] = tempTimeValue.split(':').map(Number);
      const eventDate = new Date(event.timestamp);
      const newTimestamp = new Date(
        eventDate.getFullYear(),
        eventDate.getMonth(),
        eventDate.getDate(),
        hours,
        minutes,
        seconds || 0
      ).getTime();

      onEventChange({ timestamp: newTimestamp });
      setIsEditingTime(false);
    } catch {
      toast.error('Invalid time format');
      setIsEditingTime(false);
    }
  };

  const handleTimeKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleTimeSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingTime(false);
    }
  };

  return (
    <TableRow key={`editable-event-${event.id}`}>
      <TableCell className="font-medium">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="hover:bg-muted rounded px-2 py-1 transition-colors text-left w-full">
              <span
                className={`capitalize ${event.action ? ACTION_COLOR_MAP[event.action] || 'text-gray-600' : 'text-gray-400'}`}
              >
                {event.action
                  ? event.action.replace('_', ' ')
                  : 'Select action'}
              </span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {ACTION_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => handleActionChange(option.value)}
              >
                <span
                  className={`capitalize ${ACTION_COLOR_MAP[option.value] || 'text-gray-600'}`}
                >
                  {option.label}
                </span>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
      <TableCell className="hidden min-[350px]:table-cell">
        <span className="text-muted-foreground text-sm">-</span>
      </TableCell>
      <TableCell className="text-right text-muted-foreground">
        {isEditingTime ? (
          <Input
            type="time"
            step="1"
            value={tempTimeValue}
            onChange={(e) => setTempTimeValue(e.target.value)}
            onBlur={handleTimeSubmit}
            onKeyDown={handleTimeKeyDown}
            className="w-28 h-6 text-xs text-right border-none p-1 ml-auto"
            autoFocus
          />
        ) : (
          <button
            onClick={handleTimeClick}
            className="hover:bg-muted rounded px-2 py-1 transition-colors text-xs ml-auto block"
          >
            {new Date(event.timestamp).toLocaleTimeString()}
          </button>
        )}
      </TableCell>
      <TableCell className="text-center">
        <Button
          size="sm"
          variant="ghost"
          onClick={onDelete}
          className="h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
        >
          <Trash className="h-3 w-3" />
        </Button>
      </TableCell>
    </TableRow>
  );
}
