import { Button } from '@repo/ui/components/button';
import { Card } from '@repo/ui/components/card';
import { useWebSocketCounter } from '@repo/shared/lib/hooks/use-websocket-counter';

export function CounterDemo() {
  const { count, isConnected, incrementCounter } = useWebSocketCounter();

  return (
    <Card className="p-4 space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">WebSocket Counter Demo</h3>
        <div className="flex items-center justify-center space-x-2">
          <span className="text-sm text-muted-foreground">Status:</span>
          <span
            className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="text-center space-y-3">
        <div className="text-3xl font-bold text-primary">{count}</div>
        <Button
          onClick={incrementCounter}
          disabled={!isConnected}
          className="w-full"
        >
          Increment Counter
        </Button>
      </div>

      <div className="text-xs text-muted-foreground text-center">
        This counter is synchronized across the extension and web app via
        WebSocket
      </div>
    </Card>
  );
}
