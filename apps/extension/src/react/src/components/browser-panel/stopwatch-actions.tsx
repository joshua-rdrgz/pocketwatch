import { PanelButton } from '@/components/ui/panel-button';
import { useAppSettings } from '@/hooks/use-app-settings';
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
  const { logEvent } = useAppSettings();
  const {
    timers,
    stopwatchMode,
    handleStopwatchStart,
    handleStopwatchStop,
    setStopwatchMode,
  } = useStopwatch();

  const handleStart = () => {
    console.log('HANDLE START FIRED!');
    logEvent(timers.total === 0 ? 'start' : 'resume');
    setStopwatchMode('work');
    if (timers.total === 0) {
      handleStopwatchStart();
    }
  };

  const handleBreak = () => {
    logEvent('break');
    setStopwatchMode('break');
  };

  const handleTaskComplete = () => {
    logEvent('taskComplete');
  };

  const handleFinish = () => {
    setStopwatchMode(null);
    handleStopwatchStop();
    logEvent('finish');
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
              <PanelButton tooltipSide="top" tooltipContent="Minimize Panel">
                <Minimize className="w-4 h-4" />
              </PanelButton>
              {/* Settings - Opens Side Panel */}
              <PanelButton tooltipSide="top" tooltipContent="Settings">
                <SlidersHorizontal className="w-4 h-4" />
              </PanelButton>
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
                  <PanelButton
                    tooltipSide="top"
                    tooltipContent="Finish Session"
                    onClick={handleFinish}
                  >
                    <BookCheck className="w-4 h-4" />
                  </PanelButton>
                </>
              )}
              {/* Timer - Finish Session, Opens Side Panel */}
            </motion.div>
          )}
        </AnimatePresence>
        {/* Anchor/Primary Btn - Start / Break / Resume */}
        {stopwatchMode === 'not_started' || stopwatchMode === 'break' ? (
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
        )}
      </div>
    </div>
  );
}
