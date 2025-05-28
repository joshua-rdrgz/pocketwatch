import { routerConfig } from '@/config/router-config';
import { AppSettingsProvider } from '@/hooks/use-app-settings';
import { useSidePanelSetup } from '@/hooks/use-side-panel-setup';
import { StopwatchProvider } from '@/hooks/use-stopwatch';
import { Toaster } from 'react-hot-toast';
import { createMemoryRouter, RouterProvider } from 'react-router';

const router = createMemoryRouter(routerConfig);

export default function SidePanelApp() {
  // Set up Side Panel w/Service Worker
  useSidePanelSetup();

  return (
    <div className="bg-background w-full min-h-svh flex flex-col gap-6 text-container font-sans">
      <AppSettingsProvider>
        <StopwatchProvider>
          <RouterProvider router={router} />
          <Toaster />
        </StopwatchProvider>
      </AppSettingsProvider>
    </div>
  );
}
