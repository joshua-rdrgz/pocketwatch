import { Button } from '@repo/ui/components/button';
import { useDashStore } from '@/stores/dash-store';

export function DashInitializer() {
  const { initDash } = useDashStore();

  return (
    <div className="space-y-4">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground">
          Ready to start?
        </h2>
        <p className="text-sm text-muted-foreground">
          Initialize a new dash to begin tracking your work
        </p>
      </div>
      <Button onClick={initDash} className="w-full">
        Initialize Dash
      </Button>
    </div>
  );
}
