import { useDashStore } from '@/stores/dash-store';
import { type DashInfo } from '@repo/shared/lib/dash';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@repo/ui/components/card';
import { Button } from '@repo/ui/components/button';
import { AlertCircle } from 'lucide-react';
import { useNavigate } from 'react-router';
import { DashMetadataForm } from '../shared/dash-metadata-form';

export function DashInformationTab() {
  const { dashInfo, changeDashInfo, cancelDash } = useDashStore();
  const navigate = useNavigate();

  const handleUpdateDashInfo = (formValues: DashInfo) => {
    changeDashInfo(formValues);
  };

  const handleCancelDash = () => {
    cancelDash();
    navigate('/home');
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Dash Information</CardTitle>
          <CardDescription>
            Update your dash details and settings
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

      <Card>
        <CardHeader>
          <CardTitle>Actions</CardTitle>
          <CardDescription>Manage your dash</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="destructive"
            onClick={handleCancelDash}
            className="w-full"
          >
            <AlertCircle className="h-4 w-4 mr-2" />
            Cancel Dash
          </Button>
          <p className="text-xs text-center text-muted-foreground mt-2">
            This will cancel your current dash and discard all progress
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
