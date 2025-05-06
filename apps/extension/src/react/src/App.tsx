import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@repo/ui/components/dialog';
import { Input } from '@repo/ui/components/input';
import { Label } from '@repo/ui/components/label';
import { ToggleGroup, ToggleGroupItem } from '@repo/ui/components/toggle-group';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@repo/ui/components/tooltip';
import { BarChart2, Clock, EyeOff } from 'lucide-react';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

// STOPWATCH UTIL
type StopwatchTimers = {
  total: number;
  work: number;
  break: number;
  extBreak: number;
};
type StopwatchMode = 'work' | 'break' | 'extBreak' | null;

const initialTimers: StopwatchTimers = {
  total: 0,
  work: 0,
  break: 0,
  extBreak: 0,
};

// APPLICATION CODE BEGINS
type EventType = 'start' | 'break' | 'extended_break' | 'resume' | 'finish';
type Event = { type: EventType; timestamp: number };
type AppMode = 'regular' | 'focus' | 'stats';

export default function App() {
  // Utility state
  const [appMode, setAppMode] = useState<AppMode>('regular');
  const [showFinalResultsDialog, setShowFinalResultsDialog] = useState(false);

  // Application state
  const [hourlyRate, setHourlyRate] = useState(25);
  const [events, setEvents] = useState<Event[]>([]);
  const {
    timers,
    currStopwatchMode,
    handleStopwatchStart,
    handleStopwatchStop,
    setStopwatchMode,
    resetStopwatch,
  } = useStopwatch();

  // Notify parent iframe of content height changes
  useEffect(() => {
    const notifyResize = () => {
      const contentElement = document.getElementById('app-content');
      if (contentElement) {
        const height = contentElement.getBoundingClientRect().height;
        window.parent.postMessage({ type: 'resize', height }, '*');
      }
    };

    // Initial notification
    notifyResize();

    // Create ResizeObserver to watch for content changes
    const resizeObserver = new ResizeObserver(notifyResize);
    const contentElement = document.getElementById('app-content');
    if (contentElement) {
      resizeObserver.observe(contentElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [appMode]);

  // Derived state
  const earnings = useMemo(
    () => ((timers.work / 3600000) * hourlyRate).toFixed(2),
    [timers.work, hourlyRate]
  );

  // Handler Helper
  const logEvent = (type: EventType) => {
    const newEvent: Event = { type, timestamp: Date.now() };
    setEvents((prev) => [...prev, newEvent]);
  };

  // Handlers
  const handleStart = () => {
    logEvent(timers.total === 0 ? 'start' : 'resume');
    setStopwatchMode('work');
    if (timers.total === 0) {
      handleStopwatchStart();
    }
  };

  const handleBreak = (isExtendedBreak: boolean = false) => {
    logEvent(isExtendedBreak ? 'extended_break' : 'break');
    const mode = isExtendedBreak ? 'extBreak' : 'break';
    setStopwatchMode(mode);
  };

  const handleFinish = () => {
    setStopwatchMode(null);
    handleStopwatchStop();
    logEvent('finish');
    setShowFinalResultsDialog(true);
  };

  const handleAppModeChange = (newMode: AppMode) => {
    if (newMode === appMode) return; // Prevent setting the same mode
    setAppMode(newMode);
  };

  const handleHourlyRateChange = (rate: number) => {
    setHourlyRate(rate);
  };

  return (
    <main className="w-full">
      <div id="app-content" className="w-full p-6">
        <div className="w-full max-w-md mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-lg font-semibold text-foreground">
              {appMode === 'regular'
                ? 'Model Metrics'
                : appMode === 'focus'
                  ? 'Focus Mode'
                  : 'Stats Mode'}
            </h1>
            <ToggleModes mode={appMode} onModeChange={handleAppModeChange} />
          </div>

          <Stopwatch
            mode={appMode}
            earnings={earnings}
            timers={timers}
            currStopwatchMode={currStopwatchMode}
            onStart={handleStart}
            onBreak={() => handleBreak(false)}
            onExtendedBreak={() => handleBreak(true)}
            onFinish={handleFinish}
          />

          {appMode !== 'focus' && (
            <div className="space-y-2">
              <Label htmlFor="hourly-rate" className="text-foreground">
                Hourly Rate ($)
              </Label>
              <Input
                id="hourly-rate"
                type="number"
                value={hourlyRate}
                onChange={(e) => {
                  handleHourlyRateChange(Number(e.target.value));
                }}
                className="w-full"
              />
            </div>
          )}
        </div>
      </div>

      <RecapDialog
        open={showFinalResultsDialog}
        onOpenChange={(open) => setShowFinalResultsDialog(open)}
        timers={timers}
        earnings={earnings}
        events={events}
        onNewSession={() => {
          setShowFinalResultsDialog(false);
          setEvents([]);
          resetStopwatch();
        }}
      />
    </main>
  );
}

// TOGGLE MODES
interface ToggleModesProps {
  mode: AppMode;
  onModeChange(mode: AppMode): void;
}

function ToggleModes({ mode, onModeChange }: ToggleModesProps) {
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

interface StopwatchProps {
  mode: AppMode;
  earnings: string;
  timers: StopwatchTimers;
  currStopwatchMode: StopwatchMode;
  onStart(): void;
  onBreak(): void;
  onExtendedBreak(): void;
  onFinish(): void;
}

function Stopwatch({
  mode,
  earnings,
  timers,
  currStopwatchMode,
  onStart,
  onBreak,
  onExtendedBreak,
  onFinish,
}: StopwatchProps) {
  return (
    <>
      {mode === 'focus' ? (
        <div className="text-center">
          <div className="text-xl font-mono text-gray-500 animate-pulse">
            {currStopwatchMode === 'work'
              ? 'Shh... Focusing...'
              : timers.total === 0
                ? 'Time to start!'
                : 'Break time!'}
          </div>
        </div>
      ) : (
        <>
          <div className="text-center">
            <div className="text-2xl font-mono">{formatTime(timers.work)}</div>
            <div className="text-sm text-muted-foreground mt-1">
              Earnings: ${earnings}
            </div>
          </div>
          {mode === 'stats' && (
            <Card className="bg-gradient-to-br from-background/50 to-background/90 gap-3 border-muted-foreground/30 shadow-md p-4 rounded-lg w-full max-w-md mx-auto">
              <CardHeader>
                <CardTitle className="text-center text-muted-foreground/90">
                  Timer Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {(
                    [
                      {
                        type: 'work' as const,
                        label: 'Work',
                      },
                      {
                        type: 'break' as const,
                        label: 'Break',
                      },
                      {
                        type: 'extBreak' as const,
                        label: 'Ext. Breaks',
                      },
                      {
                        type: 'total' as const,
                        label: 'Total',
                      },
                    ] as { type: StopwatchMode; label: string }[]
                  ).map(({ type, label }) => (
                    <div className="flex flex-col items-center">
                      <span className="text-sm text-muted-foreground/60 font-medium">
                        {label}
                      </span>
                      <span className="text-base text-foreground/90 font-mono">
                        {formatTime(timers[type!])}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
      <div className="flex flex-wrap gap-2 justify-center">
        {currStopwatchMode === 'work' ? (
          <>
            <Button variant="outline" onClick={onBreak}>
              Break
            </Button>

            <Button variant="outline" onClick={onExtendedBreak}>
              Ext. Break
            </Button>

            <Button variant="destructive" onClick={onFinish}>
              Finish
            </Button>
          </>
        ) : (
          <Button onClick={onStart}>
            {timers.total > 0 ? 'Resume' : 'Start'}
          </Button>
        )}
      </div>
    </>
  );
}

interface RecapDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  timers: StopwatchTimers;
  earnings: string;
  events: Event[];
  onNewSession(): void;
}

function RecapDialog({
  open,
  onOpenChange,
  timers,
  earnings,
  events,
  onNewSession,
}: RecapDialogProps) {
  const getEventColor = (type: EventType) => {
    switch (type) {
      case 'start':
      case 'resume':
        return 'border-blue-500';
      case 'break':
        return 'border-yellow-500';
      case 'extended_break':
        return 'border-orange-500';
      case 'finish':
        return 'border-red-500';
      default:
        return 'border-gray-300';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Time Tracking Results</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Here's a summary of your time tracking session.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center border-b pb-2">
              <span>Work Time</span>
              <span>{formatTime(timers.work)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span>Break Time</span>
              <span>{formatTime(timers.break)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span>Extended Break</span>
              <span>{formatTime(timers.extBreak)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span>Total Time</span>
              <span>{formatTime(timers.total)}</span>
            </div>
            <div className="flex justify-between items-center border-b pb-2">
              <span>Earnings ($)</span>
              <span>${earnings}</span>
            </div>
          </div>

          <div>
            <h3 className="font-medium mb-2">Event Timeline</h3>
            <div className="text-sm space-y-2">
              {events.map((ev, evIdx) => (
                <div
                  key={`event-${ev.type}-idx-${evIdx}`}
                  className={`flex justify-between items-center pl-3 py-2 border-l-4 rounded-sm bg-muted ${getEventColor(
                    ev.type
                  )}`}
                >
                  <span className="capitalize pl-1">
                    {ev.type.replace('_', ' ')}
                  </span>
                  <span className="text-gray-600 pr-4">
                    {new Date(ev.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <Button onClick={onNewSession} className="w-full">
            Start New Session
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// USE STOPWATCH HOOK
function useStopwatch() {
  const [timers, setTimers] = useState(initialTimers);
  const [currStopwatchMode, setCurrStopwatchMode] =
    useState<StopwatchMode>(null);
  const portRef = useRef<chrome.runtime.Port | null>(null);

  // Sync Service Worker w/UI State
  useEffect(() => {
    const port = chrome.runtime.connect({ name: 'stopwatch' });
    portRef.current = port;

    // Listen for updates
    port.onMessage.addListener((msg) => {
      if (msg.type === 'update') {
        setTimers(msg.timers);
        setCurrStopwatchMode(msg.mode);
      }
    });

    // Effect Clean Up
    return () => {
      port.disconnect();
      portRef.current = null;
    };
  }, []);

  const handleStopwatchStart = useCallback(() => {
    portRef.current?.postMessage({
      action: 'start',
      initialTimes: timers,
    });
  }, [timers]);

  const handleStopwatchStop = useCallback(() => {
    portRef.current?.postMessage({ action: 'stop' });
  }, []);

  const setStopwatchMode = useCallback((mode: StopwatchMode) => {
    portRef.current?.postMessage({ action: 'setMode', mode });
  }, []);

  const resetStopwatch = useCallback(() => {
    portRef.current?.postMessage({ action: 'reset' });
  }, []);

  return {
    timers,
    currStopwatchMode,
    handleStopwatchStart,
    handleStopwatchStop,
    setStopwatchMode,
    resetStopwatch,
  };
}

// TOOLTIP UTILITY COMPONENT
interface TooltipConfigurerProps {
  tooltipContent: string;
}

function TooltipConfigurer({
  children,
  tooltipContent,
}: React.PropsWithChildren<TooltipConfigurerProps>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">{tooltipContent}</p>
      </TooltipContent>
    </Tooltip>
  );
}

// FORMAT TIME UTIL
function formatTime(ms: number) {
  const seconds = Math.floor(ms / 1000) % 60;
  const minutes = Math.floor(ms / 60000) % 60;
  const hours = Math.floor(ms / 3600000);
  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
