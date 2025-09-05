import { useDashStore } from '@/stores/dash-store';
import { type DashInfo } from '@repo/shared/lib/dash';
import { useNavigate } from 'react-router';
import { DashMetadataForm } from './shared/dash-metadata-form';

export function DashSetupPage() {
  const { cancelDash, logEvent, changeDashInfo, dashInfo } = useDashStore();
  const navigate = useNavigate();

  const handleCancelDash = () => {
    cancelDash();
    navigate('/home');
  };

  const handleStartDash = (formValues: DashInfo) => {
    // Update Dash metadata
    changeDashInfo(formValues);

    // Begin the timer w/ start event
    logEvent({
      action: 'start',
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Let's start a dash!</h1>
        <p className="text-sm text-muted-foreground">
          Add relevant details if you have them. Don't worry — you can always
          add this later!
        </p>
      </div>

      <DashMetadataForm
        defaultValues={dashInfo}
        onSubmit={handleStartDash}
        onCancel={handleCancelDash}
        submitButtonText="Start Dash"
        showCancelButton
      />
    </div>
  );
}
