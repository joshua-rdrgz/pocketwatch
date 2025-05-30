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
      <div
        id="pocketwatch-browser-panel-content"
        className={`flex items-center p-2 ${primaryBtnHovered ? 'bg-gradient-to-r from-transparent to-black/75' : ''}`}
      >
        <BrowserPanel
          primaryBtnHovered={primaryBtnHovered}
          onPrimaryBtnHovered={setPrimaryBtnHovered}
        />
      </div>
    </Providers>
  );
}
