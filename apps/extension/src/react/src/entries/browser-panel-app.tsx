import { BrowserPanel } from '@/components/browser-panel/browser-panel';
import { Providers } from '@/config/providers';
import { useAppDimensions } from '@/hooks/use-app-dimensions';

export default function BrowserPanelApp() {
  // Make React height/width sync with vanillaJS container height
  useAppDimensions();

  return (
    <Providers>
      <div
        id="pocketwatch-browser-panel-content"
        className="flex flex-col h-full bg-background/95 backdrop-blur-sm"
      >
        <BrowserPanel />
      </div>
    </Providers>
  );
}
