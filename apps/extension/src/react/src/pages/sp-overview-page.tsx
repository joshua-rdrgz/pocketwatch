import { SessionAnalytics } from '@/components/side-panel/session-analytics';
import { TimeTracker } from '@/components/side-panel/time-tracker';

export function SPOverviewPage() {
  return (
    <div className="space-y-4">
      {/* Session Analytics - 4 Cards */}
      <SessionAnalytics />

      {/* Time Tracker - 1 Card */}
      <TimeTracker />
    </div>
  );
}
