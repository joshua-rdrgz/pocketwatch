import { Providers } from '@/config/providers';
import { routerConfig } from '@/config/router-config';
import { useSidePanelSetup } from '@/hooks/use-side-panel-setup';
import { Toaster } from 'react-hot-toast';
import { createMemoryRouter, RouterProvider } from 'react-router';

const router = createMemoryRouter(routerConfig);

export default function SidePanelApp() {
  // Set up Side Panel w/Service Worker
  useSidePanelSetup();

  return (
    <Providers>
      <div className="bg-background w-full min-h-svh flex flex-col gap-6 text-container font-sans">
        <RouterProvider router={router} />
        <Toaster />
      </div>
    </Providers>
  );
}
