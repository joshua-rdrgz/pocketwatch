import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { DashOverviewTab } from './active/dash-overview-tab';
import { DashInformationTab } from './active/dash-information-tab';

export function DashActivePage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('overview');

  // Initialize tab from URL param or default to overview
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['overview', 'information'].includes(tab)) {
      setActiveTab(tab);
    } else if (!tab) {
      // If no tab is specified, redirect to overview tab
      navigate('/dash?tab=overview', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="space-y-4 pb-20">
      {activeTab === 'overview' && <DashOverviewTab />}
      {activeTab === 'information' && <DashInformationTab />}
    </div>
  );
}
