import { PanelButton } from '@/components/ui/panel-button';
import { useSidePanelIntegration } from '@/hooks/use-side-panel-integration';
import { useDashStore } from '@/stores/dash-store';
import {
  BookCheck,
  Minimize,
  Pause,
  Play,
  SlidersHorizontal,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

interface StopwatchActionsProps {
  primaryBtnHovered: boolean;
  onPrimaryBtnHovered(isHovered: boolean): void;
}

export function StopwatchActions({
  primaryBtnHovered,
  onPrimaryBtnHovered,
}: StopwatchActionsProps) {
  const { timers, stopwatchMode, dashLifeCycle, logEvent } = useDashStore();
  const { isSidePanelOpen, toggleSidePanel } = useSidePanelIntegration();

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
        {dashLifeCycle !== 'active' ? (
          <NonActiveActions
            primaryBtnHovered={primaryBtnHovered}
            isSidePanelOpen={isSidePanelOpen}
            toggleSidePanel={toggleSidePanel}
            handleMinimize={handleMinimize}
          />
        ) : (
          <ActiveActions
            primaryBtnHovered={primaryBtnHovered}
            isSidePanelOpen={isSidePanelOpen}
            stopwatchPaused={stopwatchMode === 'break'}
            toggleSidePanel={toggleSidePanel}
            handleMinimize={handleMinimize}
            handleStart={handleStart}
            handleBreak={handleBreak}
            handleFinish={handleFinish}
          />
        )}
      </div>
    </div>
  );
}

function NonActiveActions({
  primaryBtnHovered,
  isSidePanelOpen,
  toggleSidePanel,
  handleMinimize,
}: {
  primaryBtnHovered: boolean;
  isSidePanelOpen: boolean;
  toggleSidePanel(): void;
  handleMinimize(): void;
}) {
  return (
    <>
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
          </motion.div>
        )}
      </AnimatePresence>
      {/* Anchor/Primary Btn */}
      <PanelButton
        tooltipSide="top"
        tooltipContent={isSidePanelOpen ? 'Close Settings' : 'Open Settings'}
        onClick={toggleSidePanel}
      >
        <SlidersHorizontal className="w-4 h-4" />
      </PanelButton>
    </>
  );
}

function ActiveActions({
  primaryBtnHovered,
  isSidePanelOpen,
  stopwatchPaused,
  toggleSidePanel,
  handleMinimize,
  handleStart,
  handleBreak,
  handleFinish,
}: {
  primaryBtnHovered: boolean;
  isSidePanelOpen: boolean;
  stopwatchPaused: boolean;
  toggleSidePanel(): void;
  handleMinimize(): void;
  handleStart(): void;
  handleBreak(): void;
  handleFinish(): void;
}) {
  return (
    <>
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

            {!stopwatchPaused && (
              // Timer - Finish Dash, Opens Side Panel
              <PanelButton
                tooltipSide="top"
                tooltipContent="Finish Dash"
                onClick={handleFinish}
              >
                <BookCheck className="w-4 h-4" />
              </PanelButton>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      {/* Anchor/Primary Btn */}
      {stopwatchPaused ? (
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
    </>
  );
}
