import { AuthGuard } from '@/components/auth/auth-guard';
import { DailyCalendar } from '@/components/side-panel/daily-calendar';
import { SidePanelPage } from '@/components/side-panel/side-panel-page';
import { FullErrorPage } from '@/pages/full-error-page';
import { SPLoginPage } from '@/pages/sp-login-page';
import { SPProjectDetailPage } from '@/pages/sp-project-detail-page';
import { SPProjectsPage } from '@/pages/sp-projects-page';
import { SPSessionPage } from '@/pages/sp-session-page';
import { redirect, RouteObject } from 'react-router';

export const routerConfig: RouteObject[] = [
  {
    // Ensure all home-page navigates redirect to "/calendar"
    index: true,
    loader: () => redirect('/calendar'),
  },
  {
    path: '/login',
    element: <SPLoginPage />,
    errorElement: <FullErrorPage />,
  },
  {
    path: '/',
    element: <AuthGuard />,
    errorElement: <FullErrorPage />,
    children: [
      {
        path: '/calendar',
        element: (
          <SidePanelPage>
            <DailyCalendar />
          </SidePanelPage>
        ),
      },
      {
        path: '/session',
        element: (
          <SidePanelPage>
            <SPSessionPage />
          </SidePanelPage>
        ),
      },
      {
        path: '/projects',
        element: (
          <SidePanelPage>
            <SPProjectsPage />
          </SidePanelPage>
        ),
      },
      {
        path: '/projects/:id',
        element: (
          <SidePanelPage>
            <SPProjectDetailPage />
          </SidePanelPage>
        ),
      },
    ],
  },
];
