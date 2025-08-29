import { Button } from '@repo/ui/components/button';
import { useSessionStore } from '@/stores/session-store';

export function SessionInitializer() {
  const { initSession } = useSessionStore();

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">
          Ready to start?
        </h2>
        <p className="text-sm text-muted-foreground">
          Initialize a new session to begin tracking your work
        </p>
      </div>
      <Button onClick={initSession} className="w-full">
        Initialize Session
      </Button>
    </div>
  );
}
