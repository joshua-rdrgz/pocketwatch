import { PanelButton } from '@/components/ui/panel-button';
import {
  BookCheck,
  Minimize,
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
  const handleMouseOver = () => {
    onPrimaryBtnHovered(true);
  };

  const handleMouseOut = () => {
    onPrimaryBtnHovered(false);
  };

  return (
    <div className="p-4 flex items-center">
      <div
        className={`relative ${primaryBtnHovered ? 'pl-1' : ''}`}
        onMouseOut={handleMouseOut}
        onMouseOver={handleMouseOver}
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
              {/* Timer - Mark Task Complete */}
              <PanelButton tooltipSide="top" tooltipContent="Task Complete">
                <SquareCheckBig className="w-4 h-4" />
              </PanelButton>
              {/* Timer - Finish Session, Opens Side Panel */}
              <PanelButton tooltipSide="top" tooltipContent="Finish Session">
                <BookCheck className="w-4 h-4" />
              </PanelButton>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Timer - Start / Break / Resume */}
        <PanelButton tooltipSide="top" tooltipContent="Start">
          <Play className="w-4 h-4" />
        </PanelButton>
      </div>
    </div>
  );
}
