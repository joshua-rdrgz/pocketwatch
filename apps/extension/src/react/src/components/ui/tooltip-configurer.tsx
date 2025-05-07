import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui/components/tooltip';

interface TooltipConfigurerProps {
  tooltipContent: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
}

export function TooltipConfigurer({
  children,
  tooltipContent,
  side = 'bottom',
}: React.PropsWithChildren<TooltipConfigurerProps>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side={side}>
        <p className="text-xs">{tooltipContent}</p>
      </TooltipContent>
    </Tooltip>
  );
}
