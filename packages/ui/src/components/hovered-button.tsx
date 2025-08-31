import { motion } from 'motion/react';
import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import { LucideIcon } from 'lucide-react';

interface HoveredButtonProps {
  text: string;
  variant?:
    | 'default'
    | 'destructive'
    | 'outline'
    | 'secondary'
    | 'ghost'
    | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  btnClassName?: string;
  iconClassName?: string;
  onClick?: () => void;
  icon: LucideIcon;
}

export const HoveredButton = ({
  text,
  variant = 'default',
  size = 'default',
  btnClassName,
  iconClassName,
  onClick,
  icon: Icon,
}: HoveredButtonProps) => {
  return (
    <motion.div initial="initial" whileHover="hover" className="inline-block">
      <Button
        variant={variant}
        size={size}
        className={cn(
          'group relative overflow-hidden rounded-full',
          btnClassName
        )}
        onClick={onClick}
      >
        <div className="flex items-center">
          <Icon className={cn('flex-shrink-0', iconClassName)} />
          <motion.span
            className="ml-2 whitespace-nowrap"
            variants={{
              initial: {
                width: 0,
                opacity: 0,
                marginLeft: 0,
              },
              hover: {
                width: 'auto',
                opacity: 1,
                marginLeft: 8,
                transition: {
                  width: { duration: 0.2, ease: 'easeOut' },
                  opacity: { duration: 0.15, delay: 0.05 },
                  marginLeft: { duration: 0.2, ease: 'easeOut' },
                },
              },
            }}
          >
            {text}
          </motion.span>
        </div>
      </Button>
    </motion.div>
  );
};
