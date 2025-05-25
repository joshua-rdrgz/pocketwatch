import { StopwatchActions } from '@/components/browser-panel/stopwatch-actions';
import { StopwatchStats } from '@/components/browser-panel/stopwatch-stats';
import { useAppDimensions } from '@/hooks/use-app-dimensions';
import { AppSettingsProvider } from '@/hooks/use-app-settings';
import { StopwatchProvider } from '@/hooks/use-stopwatch';
import { useState } from 'react';

export default function BrowserPanelApp() {
  const [primaryBtnHovered, setPrimaryBtnHovered] = useState(false);

  // Make React height/width sync with vanillaJS container height
  useAppDimensions();

  return (
    <main
      className={`w-full min-h-svh overflow-hidden ${primaryBtnHovered ? 'bg-gradient-to-r from-transparent to-black/75' : ''}`}
    >
      <div
        id="pocketwatch-browser-panel-content" // hook for useAppDimensions
        className="flex justify-center w-full h-full"
      >
        <AppSettingsProvider>
          <StopwatchProvider>
            {/* Left container - fills available space */}
            <StopwatchStats />

            {/* Right container - only takes required space */}
            <StopwatchActions
              primaryBtnHovered={primaryBtnHovered}
              onPrimaryBtnHovered={(isHovered) =>
                setPrimaryBtnHovered(isHovered)
              }
            />
          </StopwatchProvider>
        </AppSettingsProvider>
      </div>
    </main>
  );
}
