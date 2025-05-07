import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@repo/ui/components/tooltip';

interface TooltipConfigurerProps {
  tooltipContent: string;
}

export function TooltipConfigurer({
  children,
  tooltipContent,
}: React.PropsWithChildren<TooltipConfigurerProps>) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="bottom">
        <p className="text-xs">{tooltipContent}</p>
      </TooltipContent>
    </Tooltip>
  );
}
