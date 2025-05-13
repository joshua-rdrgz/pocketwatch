import { Button } from '@repo/ui/components/button';
import { TooltipConfigurer } from '@/components/ui/tooltip-configurer';
import React from 'react';

interface PanelButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
  tooltipContent: string;
}

export function PanelButton({
  children,
  tooltipSide = 'top',
  tooltipContent,
}: React.PropsWithChildren<PanelButtonProps>) {
  return (
    <TooltipConfigurer side={tooltipSide} tooltipContent={tooltipContent}>
      <Button
        variant="default"
        size="icon"
        className="rounded-full h-8 w-8 flex items-center justify-center hover:scale-110"
      >
        {children}
      </Button>
    </TooltipConfigurer>
  );
}
