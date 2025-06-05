import { AuthGuard } from '@/components/auth/auth-guard';
import { SessionSettings } from '@/components/side-panel/session-settings';
import { SidePanelPage } from '@/components/side-panel/side-panel-page';
import { FullErrorPage } from '@/pages/full-error-page';
import { SPDetailsPage } from '@/pages/sp-details-page';
import { SPOverviewPage } from '@/pages/sp-overview-page';
import { SPLoginPage } from '@/pages/sp-login-page';
import { redirect, RouteObject } from 'react-router';
import { DailyCalendar, Event } from '@/components/side-panel/daily-calendar';

const MOCK_EVENTS: Event[] = [
  {
    id: '1',
    title: 'Morning Meeting',
    startTime: '09:00',
    endTime: '10:00',
    date: new Date().toISOString().split('T')[0],
    description: 'Team standup meeting with detailed agenda',
    location: 'Conference Room A',
    attendees: ['John Doe', 'Jane Smith', 'Mike Johnson'],
    category: 'work',
  },
  {
    id: '2',
    title: 'Lunch Break',
    startTime: '12:30',
    endTime: '13:30',
    date: new Date().toISOString().split('T')[0],
    description: 'Break time',
    location: 'Cafeteria',
    attendees: [],
    category: 'personal',
  },
  {
    id: '3',
    title:
      'Very Long Project Planning Session With Multiple Stakeholders and Detailed Requirements Review',
    startTime: '14:00',
    endTime: '17:00',
    date: new Date().toISOString().split('T')[0],
    description: 'Extended planning session',
    location: 'Conference Room B',
    attendees: ['Multiple attendees'],
    category: 'work',
  },
  {
    id: '4',
    title: 'Tuesday Event',
    startTime: '10:00',
    endTime: '11:00',
    date: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    description: 'Event on different day',
    location: 'Office',
    attendees: ['Jane Doe'],
    category: 'work',
  },
];

export const routerConfig: RouteObject[] = [
  {
    // Ensure all home-page navigates redirect to "/overview"
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
            <DailyCalendar events={MOCK_EVENTS} />
          </SidePanelPage>
        ),
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
    ],
  },
];
