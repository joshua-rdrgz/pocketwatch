import { ToggleModes } from '@/components/toggle-modes';
import { AppMode } from '@/types/app';

interface PanelHeaderProps {
  appMode: AppMode;
  onAppModeChange(appMode: AppMode): void;
}

export function PanelHeader({ appMode, onAppModeChange }: PanelHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-lg font-semibold text-foreground">
        {appMode === 'regular'
          ? 'Model Metrics'
          : appMode === 'focus'
            ? 'Focus Mode'
            : 'Stats Mode'}
      </h1>
      <ToggleModes mode={appMode} onModeChange={onAppModeChange} />
    </div>
  );
}
