import { SessionSettings } from '@/components/side-panel/session-settings';
import { SidePanelPage } from '@/components/side-panel/side-panel-page';
import { SPDetailsPage } from '@/pages/sp-details-page';
import { SPOverviewPage } from '@/pages/sp-overview-page';
import { redirect, RouteObject } from 'react-router';

export const routerConfig: RouteObject[] = [
  {
    // Ensure all home-page navigates redirect to "/overview"
    index: true,
    loader: () => redirect('/overview'),
  },
  {
    path: '/overview',
    element: (
      <SidePanelPage>
        <SPOverviewPage />
      </SidePanelPage>
    ),
  },
  {
    path: '/details',
    element: (
      <SidePanelPage>
        <SPDetailsPage />
      </SidePanelPage>
    ),
  },
  {
    path: '/settings',
    element: (
      <SidePanelPage>
        <SessionSettings />
      </SidePanelPage>
    ),
  },
];
