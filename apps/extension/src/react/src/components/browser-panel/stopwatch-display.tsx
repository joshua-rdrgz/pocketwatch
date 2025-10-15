import { useDashStore } from '@/stores/dash-store';
import { formatTime } from '@/lib/utils';
import { Coffee, DollarSign, Zap, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

export function StopwatchDisplay() {
  const { timers, dashInfo, dashLifeCycle, stopwatchMode } = useDashStore();
  const [stealthMode, setStealthMode] = useState(false);

  // Convert milliseconds to hours for earnings calculation
  const hoursWorked = timers.work / 3600000;
  const earnings =
    dashInfo.isMonetized && dashInfo.hourlyRate
      ? (hoursWorked * dashInfo.hourlyRate).toFixed(2)
      : null;

  const isInBreak = stopwatchMode === 'break';
  const isActive = dashLifeCycle === 'active';
  const isInitialized = dashLifeCycle === 'initialized';
  const isCompleted = dashLifeCycle === 'completed';

  // Stealth mode for active dash
  if (isActive && stealthMode) {
    return (
      <div className="h-full p-3 flex flex-col items-center justify-center relative">
        <button
          onClick={() => setStealthMode(false)}
          className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-accent transition-colors"
        >
          <Eye className="w-3 h-3 text-muted-foreground" />
        </button>

        <div className="flex items-center gap-1.5 text-muted-foreground animate-pulse">
          {isInBreak ? (
            <>
              <Coffee className="w-3 h-3" />
              <span className="text-xs">On Break</span>
            </>
          ) : (
            <>
              <Zap className="w-3 h-3" />
              <span className="text-xs">Working</span>
            </>
          )}
        </div>
      </div>
    );
  }

  // No dash state
  if (!dashLifeCycle) {
    return (
      <div className="h-full p-3 flex flex-col items-center justify-center">
        <div className="space-y-2">
          <div className="p-2 rounded-full bg-primary/10 w-fit mx-auto">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div className="text-center space-y-0.5">
            <div className="text-xs font-medium">Ready to start tracking?</div>
            <div className="text-[10px] text-muted-foreground">
              Initialize a new dash to begin
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Initialized but not started
  if (isInitialized) {
    return (
      <div className="h-full p-3 flex flex-col items-center justify-center">
        <div className="space-y-2">
          <div className="p-2 rounded-full bg-primary/10 w-fit mx-auto">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <div className="text-center space-y-0.5">
            <div className="text-xs font-medium">Dash initialized</div>
            <div className="text-[10px] text-muted-foreground">
              Hit start when you're ready
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Completed but not submitted
  if (isCompleted) {
    return (
      <div className="h-full p-3 flex flex-col items-center justify-center">
        <div className="space-y-2">
          <div className="space-y-0.5 text-center">
            <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
              Total Work Time
            </div>
            <div className="font-mono text-lg font-semibold">
              {formatTime(timers.work)}
            </div>
          </div>

          {dashInfo.name && (
            <div className="text-xs font-medium text-center px-2">
              {dashInfo.name}
            </div>
          )}

          {earnings && parseFloat(earnings) > 0 && (
            <div className="space-y-0.5 text-center">
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide">
                Earned
              </div>
              <div className="flex items-center justify-center gap-0.5 text-sm font-semibold text-green-600 dark:text-green-500">
                <DollarSign className="w-3 h-3" />
                <span>{earnings}</span>
              </div>
            </div>
          )}

          <div className="pt-1 text-center">
            <div className="text-[10px] text-muted-foreground">
              Ready to submit your dash
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Active dash - Work or Break mode with toned down break styling
  return (
    <div
      className={`h-full p-3 relative transition-all duration-150 ${
        isInBreak ? 'dark:bg-background/70 bg-background/90' : ''
      }`}
    >
      {isActive && (
        <button
          onClick={() => setStealthMode(true)}
          className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-accent transition-colors"
        >
          <EyeOff className="w-3 h-3 text-muted-foreground" />
        </button>
      )}

      <div className="h-full flex flex-col items-center justify-center">
        <div className="space-y-1.5">
          {/* Mode indicator */}
          <div
            className={`flex items-center justify-center gap-1.5 transition-all duration-150 ${
              isInBreak ? 'scale-90 opacity-80' : ''
            }`}
          >
            {isInBreak ? (
              <>
                <Coffee className="w-3 h-3 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  Break Time
                </span>
              </>
            ) : (
              <>
                <Zap className="w-3 h-3 text-primary" />
                <span className="text-xs font-medium">Working</span>
              </>
            )}
          </div>

          {/* Timer display */}
          <div
            className={`text-center transition-all duration-150 ${
              isInBreak ? 'scale-95' : ''
            }`}
          >
            <div
              className={`font-mono font-semibold transition-all duration-150 ${
                isInBreak ? 'text-xl opacity-80' : 'text-2xl'
              }`}
            >
              {formatTime(isInBreak ? timers.break : timers.work)}
            </div>
          </div>

          {/* Additional info */}
          <div
            className={`space-y-1 text-center transition-all duration-150 ${
              isInBreak ? 'scale-90 opacity-70' : ''
            }`}
          >
            {dashInfo.name && (
              <div className="text-xs font-medium px-2">{dashInfo.name}</div>
            )}

            {/* Contextualized earnings - only show during work mode */}
            {!isInBreak && earnings && parseFloat(earnings) > 0 && (
              <div className="flex items-center justify-center gap-2 text-[10px] bg-accent/50 rounded-full px-2 py-1 mx-auto w-fit">
                <div className="text-muted-foreground">Earned:</div>
                <div className="flex items-center gap-0.5 font-medium">
                  <DollarSign className="w-2.5 h-2.5" />
                  <span>{earnings}</span>
                </div>
              </div>
            )}

            {isInBreak && timers.total > 0 && (
              <div className="text-[10px] text-muted-foreground">
                Total: {formatTime(timers.total)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
