import { SidePanelActions } from '@/components/side-panel/side-panel-actions';
import { useGoogleSignOut } from '@/hooks/auth/use-google-sign-out';
import { useSignoutListeners } from '@/hooks/auth/use-signout-listeners';
import { useAppSettings } from '@/hooks/use-app-settings';
import { Button } from '@repo/ui/components/button';
import { cn } from '@repo/ui/lib/utils';
import { LogOut } from 'lucide-react';

export function SidePanelHeader() {
  const { isSessionFinished } = useAppSettings();
  const { mutate: signOutViaGoogle } = useGoogleSignOut();

  useSignoutListeners();

  const handleSignOut = () => {
    signOutViaGoogle();
  };

  return (
    <header
      className={cn(
        'w-full bg-primary/10 text-primary backdrop-blur-md rounded-b-3xl px-4 pt-6 border-b shadow-sm',
        isSessionFinished ? 'pb-2' : 'pb-4'
      )}
    >
      <div className="flex justify-between items-center gap-5">
        <div className="flex flex-col">
          <h1 className="text-2xl font-bold">Pocketwatch</h1>
          <p className="text-primary/60 text-sm">
            Track productivity and earnings in real-time
          </p>
        </div>
        <Button
          onClick={handleSignOut}
          variant="outline"
          size="icon"
          className="h-8 w-8 bg-primary/5 hover:bg-primary/5 border border-primary"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
      <SidePanelActions />
    </header>
  );
}
