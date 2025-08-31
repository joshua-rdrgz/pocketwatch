import { AuthGuard } from '@/components/auth/auth-guard';
import { SidePanelPage } from '@/components/side-panel/side-panel-page';
import { FullErrorPage } from '@/pages/full-error-page';
import { SPLoginPage } from '@/pages/sp-login-page';
import { SPSessionFlowPage } from '@/pages/sp-session-flow-page';
import { redirect, RouteObject } from 'react-router';

export const routerConfig: RouteObject[] = [
  {
    // Ensure all home-page navigates redirect to "/session"
    index: true,
    loader: () => redirect('/session'),
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
        path: '/session',
        element: (
          <SidePanelPage>
            <SPSessionFlowPage />
          </SidePanelPage>
        ),
      },
    ],
  },
];
