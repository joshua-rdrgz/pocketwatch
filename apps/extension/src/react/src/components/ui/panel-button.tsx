import { Button } from '@repo/ui/components/button';
import { TooltipConfigurer } from '@/components/ui/tooltip-configurer';
import React from 'react';
import { cn } from '@repo/ui/lib/utils';
import { buttonVariants, type VariantProps } from '@repo/ui/components/button';

interface PanelButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left';
  tooltipContent: string;
  btnClassName?: string;
}

export function PanelButton({
  children,
  tooltipSide = 'top',
  tooltipContent,
  btnClassName,
  variant = 'default',
  size = 'icon',
  ...props
}: React.PropsWithChildren<PanelButtonProps>) {
  return (
    <TooltipConfigurer side={tooltipSide} tooltipContent={tooltipContent}>
      <Button
        variant={variant}
        size={size}
        className={cn(
          'rounded-full h-8 w-8 flex items-center justify-center hover:scale-110 active:scale-95 transition-transform duration-100',
          btnClassName
        )}
        {...props}
      >
        {children}
      </Button>
    </TooltipConfigurer>
  );
}
