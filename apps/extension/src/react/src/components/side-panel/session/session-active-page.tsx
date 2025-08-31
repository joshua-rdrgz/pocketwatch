import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@repo/ui/components/tabs';
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { SessionTimelineScreen } from './active/session-timeline-screen';
import { SessionAnalyticsScreen } from './active/session-analytics-screen';

export function SessionActivePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Initialize tab from URL param or default to overview
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'details'].includes(tab)) {
      setActiveTab(tab);
    } else if (!tab) {
      // If no tab is specified, redirect to overview tab
      navigate('/session?tab=overview', { replace: true });
    }
  }, [searchParams, navigate]);

  const handleTabChange = (value: string) => {
    navigate(`/session?tab=${value}`);
  };

  return (
    <div className="space-y-4">
      <Tabs
        value={activeTab}
        onValueChange={handleTabChange}
        className="w-full"
      >
        <TabsList className="w-full grid grid-cols-2">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="pt-4">
          <SessionAnalyticsScreen />
        </TabsContent>

        <TabsContent value="details" className="pt-4">
          <SessionTimelineScreen />
        </TabsContent>
      </Tabs>
    </div>
  );
}
