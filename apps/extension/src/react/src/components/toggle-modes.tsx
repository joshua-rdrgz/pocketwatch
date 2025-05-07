import { TooltipConfigurer } from '@/components/tooltip-configurer';
import { AppMode } from '@/types/app';
import { ToggleGroup, ToggleGroupItem } from '@repo/ui/components/toggle-group';
import { TooltipProvider } from '@repo/ui/components/tooltip';
import { BarChart2, Clock, EyeOff } from 'lucide-react';

interface ToggleModesProps {
  mode: AppMode;
  onModeChange(mode: AppMode): void;
}

export function ToggleModes({ mode, onModeChange }: ToggleModesProps) {
  return (
    <TooltipProvider>
      <ToggleGroup
        type="single"
        value={mode}
        onValueChange={(value: AppMode) => {
          if (value) onModeChange(value);
        }}
        className="relative"
      >
        <TooltipConfigurer tooltipContent="Regular Mode">
          <ToggleGroupItem
            value="regular"
            aria-label="Regular mode"
            disabled={mode === 'regular'}
          >
            <Clock className="h-4 w-4" />
          </ToggleGroupItem>
        </TooltipConfigurer>
        <TooltipConfigurer tooltipContent="Focus Mode">
          <ToggleGroupItem
            value="focus"
            aria-label="Focus mode"
            disabled={mode === 'focus'}
          >
            <EyeOff className="h-4 w-4" />
          </ToggleGroupItem>
        </TooltipConfigurer>
        <TooltipConfigurer tooltipContent="Stats Mode">
          <ToggleGroupItem
            value="stats"
            aria-label="Stats mode"
            disabled={mode === 'stats'}
          >
            <BarChart2 className="h-4 w-4" />
          </ToggleGroupItem>
        </TooltipConfigurer>
      </ToggleGroup>
    </TooltipProvider>
  );
}
