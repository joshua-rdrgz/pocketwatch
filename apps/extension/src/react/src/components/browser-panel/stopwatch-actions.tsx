import { PanelButton } from '@/components/ui/panel-button';
import { useSession } from '@/hooks/use-session';
import { useSidePanelIntegration } from '@/hooks/use-side-panel-integration';
import { useStopwatch } from '@/hooks/use-stopwatch';
import {
  BookCheck,
  Minimize,
  Pause,
  Play,
  SlidersHorizontal,
  SquareCheckBig,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StopwatchActionsProps {
  primaryBtnHovered: boolean;
  onPrimaryBtnHovered(isHovered: boolean): void;
}

export function StopwatchActions({
  primaryBtnHovered,
  onPrimaryBtnHovered,
}: StopwatchActionsProps) {
  const { logEvent, isSessionFinished } = useSession();
  const {
    timers,
    stopwatchMode,
    handleStopwatchStart,
    handleStopwatchStop,
    setStopwatchMode,
  } = useStopwatch();
  const { isSidePanelOpen, toggleSidePanel } = useSidePanelIntegration();

  const handleStart = () => {
    logEvent({
      type: 'stopwatch',
      action: timers.total === 0 ? 'start' : 'resume',
    });
    setStopwatchMode('work');
    if (timers.total === 0) {
      handleStopwatchStart();
    }
  };

  const handleBreak = () => {
    logEvent({
      type: 'stopwatch',
      action: 'break',
    });
    setStopwatchMode('break');
  };

  const handleTaskComplete = () => {
    logEvent({
      type: 'task',
      action: 'task_complete',
    });
  };

  const handleFinish = () => {
    setStopwatchMode(null);
    handleStopwatchStop();
    logEvent({
      type: 'stopwatch',
      action: 'finish',
    });
    if (!isSidePanelOpen) {
      toggleSidePanel();
    }
  };

  const handleMinimize = () => {
    window.parent.postMessage({ type: 'minimize' }, '*');
  };

  const handleContainerMouseOver = () => {
    onPrimaryBtnHovered(true);
  };

  const handleContainerMouseOut = () => {
    onPrimaryBtnHovered(false);
  };

  return (
    <div className="p-4 flex items-center">
      <div
        className={`relative ${primaryBtnHovered ? 'pl-1' : ''}`}
        onMouseOut={handleContainerMouseOut}
        onMouseOver={handleContainerMouseOver}
      >
        <AnimatePresence>
          {primaryBtnHovered && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="absolute right-full top-1/2 -translate-y-1/2 flex gap-2 z-10 pr-1"
            >
              {/* Minimize - Minimizes Panel */}
              <PanelButton
                tooltipSide="top"
                tooltipContent="Minimize Panel"
                onClick={handleMinimize}
                variant="secondary"
              >
                <Minimize className="w-4 h-4" />
              </PanelButton>
              {/* Settings - Opens Side Panel */}
              {!isSessionFinished && (
                <PanelButton
                  tooltipSide="top"
                  tooltipContent={
                    isSidePanelOpen ? 'Close Settings' : 'Open Settings'
                  }
                  onClick={toggleSidePanel}
                  variant="secondary"
                >
                  <SlidersHorizontal className="w-4 h-4" />
                </PanelButton>
              )}
              {stopwatchMode === 'work' && (
                <>
                  {/* Timer - Mark Task Complete */}
                  <PanelButton
                    tooltipSide="top"
                    tooltipContent="Task Complete"
                    onClick={handleTaskComplete}
                  >
                    <SquareCheckBig className="w-4 h-4" />
                  </PanelButton>
                  {/* Timer - Finish Session, Opens Side Panel */}
                  <PanelButton
                    tooltipSide="top"
                    tooltipContent="Finish Session"
                    onClick={handleFinish}
                  >
                    <BookCheck className="w-4 h-4" />
                  </PanelButton>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
        {/* Anchor/Primary Btn */}
        {!isSessionFinished ? (
          // Session Not Finished - Start / Break / Resume
          stopwatchMode === 'not_started' || stopwatchMode === 'break' ? (
            <PanelButton
              tooltipSide="top"
              tooltipContent="Start"
              onClick={handleStart}
            >
              <Play className="w-4 h-4" />
            </PanelButton>
          ) : (
            <PanelButton
              tooltipSide="top"
              tooltipContent="Break"
              onClick={handleBreak}
            >
              <Pause className="w-4 h-4" />
            </PanelButton>
          )
        ) : (
          // Session Finished - Settings
          <PanelButton
            tooltipSide="top"
            tooltipContent={
              isSidePanelOpen ? 'Close Settings' : 'Open Settings'
            }
            onClick={toggleSidePanel}
          >
            <SlidersHorizontal className="w-4 h-4" />
          </PanelButton>
        )}
      </div>
    </div>
  );
}
