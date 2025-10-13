import { AuthGuard } from '@/components/auth/auth-guard';
import { SidePanelPage } from '@/components/side-panel/side-panel-page';
import { FullErrorPage } from '@/pages/full-error-page';
import { SPLoginPage } from '@/pages/sp-login-page';
import { SPDashFlowPage } from '@/pages/sp-dash-flow-page';
import { SPHomePage } from '@/pages/sp-home-page';
import { redirect, RouteObject } from 'react-router';

export const routerConfig: RouteObject[] = [
  {
    // Ensure all home-page navigates redirect to "/home"
    index: true,
    loader: () => redirect('/home'),
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
        path: '/home',
        element: (
          <SidePanelPage navVariant="home">
            <SPHomePage />
          </SidePanelPage>
        ),
      },
      {
        path: '/dash',
        element: (
          <SidePanelPage navVariant="dash">
            <SPDashFlowPage />
          </SidePanelPage>
        ),
      },
    ],
  },
];
