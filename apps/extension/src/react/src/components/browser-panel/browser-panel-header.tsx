import { ToggleModes } from '@/components/browser-panel/toggle-modes';
import { AppMode } from '@/types/app';
import { Clock } from 'lucide-react';

interface BrowserPanelHeaderProps {
  appMode: AppMode;
  onAppModeChange(appMode: AppMode): void;
}

export function BrowserPanelHeader({
  appMode,
  onAppModeChange,
}: BrowserPanelHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <div className="flex items-center gap-1">
        <Clock className="w-6 h-6" />
        <h1 className="text-lg font-semibold text-foreground">
          {appMode === 'regular'
            ? 'Pocketwatch'
            : appMode === 'focus'
              ? 'Focus Mode'
              : 'Stats Mode'}
        </h1>
      </div>
      <ToggleModes mode={appMode} onModeChange={onAppModeChange} />
    </div>
  );
}
