import { BrowserPanel } from '@/components/browser-panel/browser-panel';
import { Providers } from '@/config/providers';
import { useAppDimensions } from '@/hooks/use-app-dimensions';
import { useState } from 'react';

export default function BrowserPanelApp() {
  const [primaryBtnHovered, setPrimaryBtnHovered] = useState(false);

  // Make React height/width sync with vanillaJS container height
  useAppDimensions();

  return (
    <Providers>
      <main
        className={`w-full min-h-svh overflow-hidden ${primaryBtnHovered ? 'bg-gradient-to-r from-transparent to-black/75' : ''}`}
      >
        <div
          id="pocketwatch-browser-panel-content" // hook for useAppDimensions
          className="flex justify-center w-full h-full"
        >
          <BrowserPanel
            primaryBtnHovered={primaryBtnHovered}
            onPrimaryBtnHovered={setPrimaryBtnHovered}
          />
        </div>
      </main>
    </Providers>
  );
}
