import { useDashStore } from '@/stores/dash-store';
import { Button } from '@repo/ui/components/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { CheckCircle, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { TimeTracker } from '../time-tracker';
import { EditableEventTimeline } from './editable-event-timeline';
import { DashMetadataForm } from './shared/dash-metadata-form';
import { DashInfo } from '@repo/shared/lib/dash';
import { useElementHeight } from '@/hooks/use-element-height';

export function DashCompletedPage() {
  const { completeDash, cancelDash, dashInfo, changeDashInfo } = useDashStore();
  const navigate = useNavigate();
  const actionsHeight = useElementHeight('[data-fixed-actions]');

  const handleFinishDash = () => {
    completeDash();
    navigate('/home');
  };

  const handleCancelDash = () => {
    cancelDash();
    navigate('/home');
  };

  const handleUpdateDashInfo = (formValues: DashInfo) => {
    changeDashInfo(formValues);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header Section */}
      <div className="px-4 pb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold">Dash Complete</h1>
          <CheckCircle className="h-6 w-6 text-green-500" />
        </div>
        <p className="text-base text-muted-foreground mt-2">
          Review your dash summary and finalize your work session
        </p>
      </div>

      {/* Content Cards */}
      <div
        className="px-4 space-y-6"
        style={{ paddingBottom: actionsHeight + 16 }}
      >
        {/* Time Distribution Card */}
        <TimeTracker />

        {/* Event Timeline Card */}
        <EditableEventTimeline />

        {/* Dash Information Card */}
        <Card>
          <CardHeader>
            <CardTitle>Dash Information</CardTitle>
            <CardDescription>
              Review and adjust your dash details before finalizing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashMetadataForm
              defaultValues={dashInfo}
              onSubmit={handleUpdateDashInfo}
              submitButtonText="Update Information"
              validateChanges
            />
          </CardContent>
        </Card>
      </div>

      {/* Fixed Bottom Actions */}
      <div
        data-fixed-actions
        className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t p-4"
      >
        <div className="max-w-md mx-auto space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleCancelDash}
              className="flex-1"
              size="lg"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            <Button onClick={handleFinishDash} className="flex-1" size="lg">
              <CheckCircle className="h-4 w-4 mr-2" />
              Finish
            </Button>
          </div>
          <div className="text-center space-y-1">
            <p className="text-xs text-muted-foreground">
              <strong>Cancel:</strong> Discard this dash and all progress
            </p>
            <p className="text-xs text-muted-foreground">
              <strong>Finish:</strong> Save and finalize your completed dash
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
