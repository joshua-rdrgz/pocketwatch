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

class StopwatchWorker {
  private startTime: number | null = null;
  private timerInterval: number | null = null;
  private timers: StopwatchTimers = {
    total: 0,
    work: 0,
    break: 0,
    extBreak: 0,
  };
  private currentMode: StopwatchMode = null;
  private lastTick: number | null = null;

  start(initialTimes = { total: 0, work: 0, break: 0, extBreak: 0 }) {
    this.timers = initialTimes;
    this.startTime = Date.now();
    this.currentMode = 'work';

    if (this.timerInterval === null) {
      this.timerInterval = setInterval(() => {
        const now = Date.now();
        const delta = now - (this.lastTick || now);
        this.lastTick = now;

        this.timers.total = now - this.startTime!;

        if (this.currentMode) {
          this.timers[this.currentMode] += delta;
        }
      }, 100) as unknown as number;
    }
  }

  setMode(mode: 'work' | 'break' | 'extBreak' | null) {
    this.currentMode = mode;
    this.lastTick = Date.now();
  }

  stop() {
    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  reset() {
    this.stop();
    this.startTime = null;
    this.lastTick = null;
    this.currentMode = null;
    this.timers = { total: 0, work: 0, break: 0, extBreak: 0 };
  }

  getElapsedTimes() {
    return this.timers;
  }
}

// Update worker script
const stopwatchWorkerScript = `
  ${StopwatchWorker.toString()}
  
  const worker = new StopwatchWorker();

  self.onmessage = function(e) {
    switch(e.data.type) {
      case 'start':
        worker.start(e.data.initialTimes || undefined);
        break;
        
      case 'stop':
        worker.stop();
        break;

      case 'setMode':
        worker.setMode(e.data.mode);
        break;
        
      case 'getTime':
        const times = worker.getElapsedTimes();
        self.postMessage({ type: 'time', value: times });
        break;
      
      case 'reset':
        worker.reset();
        self.postMessage({ type: 'reset' });
        break;
    }
  };
  
  self.postMessage({ type: 'ready' });
`;
const stopwatchWorkerBlob = new Blob([stopwatchWorkerScript], {
  type: 'text/javascript',
});
const stopwatchWorkerUrl = URL.createObjectURL(stopwatchWorkerBlob);

// Broadcast Channel
const TIMER_CHANNEL_NAME = 'time-tracker-channel';

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

  // Broadcast Channel
  const { broadcast } = useBroadcastChannel({
    setAppMode,
    setHourlyRate,
    setEvents,
    handleStopwatchStart,
    handleStopwatchStop,
    setStopwatchMode,
    resetStopwatch,
  });

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
    broadcast('EVENT_ADDED', newEvent);
  };

  // Handlers
  const handleStart = () => {
    logEvent(timers.total === 0 ? 'start' : 'resume');
    setStopwatchMode('work');
    broadcast('TIMER_MODE_CHANGE', 'work');
    if (timers.total === 0) {
      handleStopwatchStart();
      broadcast('TIMER_START', null);
    }
  };

  const handleBreak = (isExtendedBreak: boolean = false) => {
    logEvent(isExtendedBreak ? 'extended_break' : 'break');
    const mode = isExtendedBreak ? 'extBreak' : 'break';
    setStopwatchMode(mode);
    broadcast('TIMER_MODE_CHANGE', mode);
  };

  const handleFinish = () => {
    setStopwatchMode(null);
    broadcast('TIMER_MODE_CHANGE', null);
    handleStopwatchStop();
    broadcast('TIMER_STOP', null);
    logEvent('finish');
    setShowFinalResultsDialog(true);
  };

  const handleAppModeChange = (newMode: AppMode) => {
    if (newMode === appMode) return; // Prevent setting the same mode
    setAppMode(newMode);
    broadcast('APP_MODE_CHANGE', newMode);
  };

  const handleHourlyRateChange = (rate: number) => {
    setHourlyRate(rate);
    broadcast('HOURLY_RATE_CHANGE', rate);
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
          broadcast('TIMER_RESET', null);
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
  const stopwatchWorkerRef = useRef<Worker | null>(null);
  const intervalIdRef = useRef<NodeJS.Timeout | null>(null);

  const obtainWorkerMessageHandler = useCallback(
    (workerInstance: Worker) => (event: MessageEvent) => {
      switch (event.data.type) {
        case 'ready':
          stopwatchWorkerRef.current = workerInstance;
          break;

        case 'time':
          setTimers(event.data.value);
          break;
      }
    },
    []
  );

  // Initialize Stopwatch Worker
  useEffect(() => {
    const workerInstance = new Worker(stopwatchWorkerUrl);

    workerInstance.onmessage = obtainWorkerMessageHandler(workerInstance);

    workerInstance.onerror = (error) => {
      console.error('Worker error:', error);
    };

    return () => {
      workerInstance.terminate();
    };
  }, [obtainWorkerMessageHandler]);

  // Sync Stopwatch Worker w/UI State
  useEffect(() => {
    if (currStopwatchMode !== null && stopwatchWorkerRef.current) {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }

      intervalIdRef.current = setInterval(() => {
        stopwatchWorkerRef.current?.postMessage({ type: 'getTime' });
      }, 100);
    } else if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
      intervalIdRef.current = null;
    }

    return () => {
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
        intervalIdRef.current = null;
      }
    };
  }, [currStopwatchMode]);

  const handleStopwatchStart = useCallback(async () => {
    if (stopwatchWorkerRef.current) {
      stopwatchWorkerRef.current.postMessage({
        type: 'start',
        initialTimes: timers,
      });
    } else {
      console.warn('Cannot start - worker not ready');
    }
  }, [timers]);

  const handleStopwatchStop = useCallback(async () => {
    if (stopwatchWorkerRef.current) {
      stopwatchWorkerRef.current.postMessage({ type: 'stop' });
    } else {
      console.warn('Cannot stop - worker not ready');
    }
  }, []);

  const setStopwatchMode = useCallback((mode: StopwatchMode) => {
    if (stopwatchWorkerRef.current) {
      setCurrStopwatchMode(mode);
      stopwatchWorkerRef.current.postMessage({ type: 'setMode', mode });
    }
  }, []);

  const resetStopwatch = useCallback(() => {
    if (stopwatchWorkerRef.current) {
      stopwatchWorkerRef.current.postMessage({ type: 'reset' });
      setTimers(initialTimers);
      setCurrStopwatchMode(null);
    }
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

// BROADCAST CHANNEL ITEMS
type BroadcastMessage = {
  type: string;
  payload: unknown;
  sourceId: string; // Unique identifier for the tab that sent the message
};

const TAB_ID = crypto.randomUUID();

interface UseBroadcastChannelProps {
  setAppMode: React.Dispatch<React.SetStateAction<AppMode>>;
  setHourlyRate: React.Dispatch<React.SetStateAction<number>>;
  setEvents: React.Dispatch<React.SetStateAction<Event[]>>;
  handleStopwatchStart(): Promise<void>;
  handleStopwatchStop(): Promise<void>;
  setStopwatchMode(mode: StopwatchMode): void;
  resetStopwatch(): void;
}

function useBroadcastChannel({
  setAppMode,
  setHourlyRate,
  setEvents,
  handleStopwatchStart,
  handleStopwatchStop,
  setStopwatchMode,
  resetStopwatch,
}: UseBroadcastChannelProps) {
  const broadcastChannelRef = useRef<BroadcastChannel | null>(null);

  const handleChannelMessage = useCallback(
    (event: MessageEvent) => {
      const { type, payload, sourceId } = event.data as BroadcastMessage;

      if (sourceId === TAB_ID) {
        return;
      }

      switch (type) {
        case 'APP_MODE_CHANGE':
          setAppMode(payload as AppMode);
          break;
        case 'HOURLY_RATE_CHANGE':
          setHourlyRate(payload as number);
          break;
        case 'EVENT_ADDED':
          setEvents((prev) => [...prev, payload as Event]);
          break;
        case 'TIMER_MODE_CHANGE':
          setStopwatchMode(payload as StopwatchMode);
          break;
        case 'TIMER_START':
          handleStopwatchStart();
          break;
        case 'TIMER_STOP':
          handleStopwatchStop();
          break;
        case 'TIMER_RESET':
          resetStopwatch();
          setEvents([]);
          break;
      }
    },
    [
      handleStopwatchStart,
      handleStopwatchStop,
      resetStopwatch,
      setAppMode,
      setEvents,
      setHourlyRate,
      setStopwatchMode,
    ]
  );

  // Initialize Broadcast Channel
  useEffect(() => {
    const channel = new BroadcastChannel(TIMER_CHANNEL_NAME);
    channel.onmessage = handleChannelMessage;
    broadcastChannelRef.current = channel;

    return () => {
      channel.close();
      broadcastChannelRef.current = null;
    };
  }, [handleChannelMessage]);

  const broadcast = (type: string, payload: unknown) => {
    if (broadcastChannelRef.current) {
      const message: BroadcastMessage = {
        type,
        payload,
        sourceId: TAB_ID,
      };
      broadcastChannelRef.current.postMessage(message);
    }
  };

  return { broadcast };
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
