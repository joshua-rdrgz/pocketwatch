import { useAppSettings } from '@/hooks/use-app-settings';
import { useStopwatch } from '@/hooks/use-stopwatch';
import { Button } from '@repo/ui/components/button';
import { TimerReset } from 'lucide-react';

export function SidePanelActions() {
  const { clearEvents, isSessionFinished } = useAppSettings();
  const { resetStopwatch } = useStopwatch();

  const resetSession = () => {
    clearEvents();
    resetStopwatch();
  };

  return (
    <>
      {isSessionFinished && (
        <Button
          variant="secondary"
          className="w-full flex gap-2 justify-center items-center hover:scale-105 active:scale-95 my-4"
          onClick={resetSession}
        >
          <TimerReset className="w-4 h-4" />
          Start a New Session
        </Button>
      )}
    </>
  );
}
