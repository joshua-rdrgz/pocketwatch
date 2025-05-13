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
      <TooltipContent
        side={side}
        className="px-2 pt-1 pb-0.5 mb-1 text-[8px] "
        arrowClassName="size-2 translate-y-[calc(-50%_-_1px)]"
      >
        <p>{tooltipContent}</p>
      </TooltipContent>
    </Tooltip>
  );
}
