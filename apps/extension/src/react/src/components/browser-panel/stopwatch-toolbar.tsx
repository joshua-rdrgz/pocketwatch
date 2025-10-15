import { PanelButton } from '@/components/ui/panel-button';
import { useSidePanelIntegration } from '@/hooks/use-side-panel-integration';
import { useDashStore } from '@/stores/dash-store';
import {
  BookCheck,
  Send,
  Minimize,
  Pause,
  Play,
  Plus,
  SlidersHorizontal,
  Zap,
} from 'lucide-react';

export function StopwatchToolbar() {
  const {
    timers,
    stopwatchMode,
    dashLifeCycle,
    logEvent,
    initDash,
    completeDash,
  } = useDashStore();
  const { isSidePanelOpen, toggleSidePanel } = useSidePanelIntegration();

  const handleInitialize = () => {
    initDash();
    if (!isSidePanelOpen) {
      toggleSidePanel();
    }
  };

  const handleStart = () => {
    logEvent({
      action: timers.total === 0 ? 'start' : 'resume',
    });
  };

  const handleBreak = () => {
    logEvent({
      action: 'break',
    });
  };

  const handleFinish = () => {
    logEvent({
      action: 'finish',
    });
    if (!isSidePanelOpen) {
      toggleSidePanel();
    }
  };

  const handleSubmit = () => {
    completeDash();
    if (!isSidePanelOpen) {
      toggleSidePanel();
    }
  };

  const handleMinimize = () => {
    window.parent.postMessage({ type: 'minimize' }, '*');
  };

  const isActive = dashLifeCycle === 'active';
  const isInitialized = dashLifeCycle === 'initialized';
  const isCompleted = dashLifeCycle === 'completed';
  const isPaused = stopwatchMode === 'break';

  const renderPrimaryButton = () => {
    if (!dashLifeCycle) {
      return (
        <PanelButton
          tooltipSide="top"
          tooltipContent="Initialize Dash"
          onClick={handleInitialize}
          variant="default"
        >
          <Plus className="w-4 h-4" />
        </PanelButton>
      );
    }

    if (isInitialized) {
      return (
        <PanelButton
          tooltipSide="top"
          tooltipContent="Start Dash"
          onClick={handleStart}
          variant="default"
        >
          <Zap className="w-4 h-4" />
        </PanelButton>
      );
    }

    if (isCompleted) {
      return (
        <div className="relative">
          <PanelButton
            tooltipSide="top"
            tooltipContent="Submit Dash"
            onClick={handleSubmit}
            variant="default"
          >
            <Send className="w-4 h-4" />
          </PanelButton>
        </div>
      );
    }

    if (isActive) {
      if (isPaused) {
        return (
          <PanelButton
            tooltipSide="top"
            tooltipContent="Resume Work"
            onClick={handleStart}
            variant="default"
          >
            <Play className="w-4 h-4" />
          </PanelButton>
        );
      } else {
        return (
          <PanelButton
            tooltipSide="top"
            tooltipContent="Take Break"
            onClick={handleBreak}
            variant="default"
          >
            <Pause className="w-4 h-4" />
          </PanelButton>
        );
      }
    }

    return null;
  };

  return (
    <div
      className={`flex items-center justify-between gap-2 p-3 border-t transition-all duration-500 ${
        isPaused
          ? 'bg-background/70 dark:bg-background/50 opacity-90'
          : 'bg-background'
      }`}
    >
      <div className="flex items-center gap-2">
        <PanelButton
          tooltipSide="top"
          tooltipContent="Minimize"
          onClick={handleMinimize}
          variant="ghost"
        >
          <Minimize className="w-4 h-4" />
        </PanelButton>

        <PanelButton
          tooltipSide="top"
          tooltipContent={isSidePanelOpen ? 'Close Settings' : 'Open Settings'}
          onClick={toggleSidePanel}
          variant="ghost"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </PanelButton>
      </div>

      <div className="flex items-center gap-2">
        {isActive && stopwatchMode !== 'break' && (
          <PanelButton
            tooltipSide="top"
            tooltipContent="Finish Dash"
            onClick={handleFinish}
            variant="ghost"
          >
            <BookCheck className="w-4 h-4" />
          </PanelButton>
        )}

        {renderPrimaryButton()}
      </div>
    </div>
  );
}
