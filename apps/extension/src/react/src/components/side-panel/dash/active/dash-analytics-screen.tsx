import { DashAnalytics } from '@/components/side-panel/dash-analytics';
import { TimeTracker } from '@/components/side-panel/time-tracker';

export function DashAnalyticsScreen() {
  return (
    <div className="space-y-4">
      {/* Dash Analytics - 4 Cards */}
      <DashAnalytics />

      {/* Time Tracker - 1 Card */}
      <TimeTracker />
    </div>
  );
}
