import { useWebSocketCounter } from '@repo/shared/lib/hooks/use-websocket-counter';

export function CounterDisplay() {
  const { count, isConnected } = useWebSocketCounter();

  return (
    <div className="flex items-center space-x-2 text-sm">
      <span className="text-muted-foreground">Counter:</span>
      <div className="flex items-center space-x-1">
        <span className="font-medium text-primary">{count}</span>
        <div
          className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}
          title={isConnected ? 'Connected' : 'Disconnected'}
        />
      </div>
    </div>
  );
}
