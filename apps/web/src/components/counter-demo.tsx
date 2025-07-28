'use client';

import { Button } from '@repo/ui/components/button';
import { Card } from '@repo/ui/components/card';
import { useWebSocketCounter } from '@repo/shared/lib/hooks/use-websocket-counter';

export function CounterDemo() {
  const { count, isConnected, incrementCounter } = useWebSocketCounter();

  return (
    <Card className="p-6 space-y-6 max-w-md mx-auto">
      <div className="text-center space-y-3">
        <h2 className="text-2xl font-bold">WebSocket Counter Demo</h2>
        <div className="flex items-center justify-center space-x-2">
          <span className="text-sm text-gray-600">Status:</span>
          <span
            className={`text-sm font-medium ${isConnected ? 'text-green-600' : 'text-red-600'}`}
          >
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
      </div>

      <div className="text-center space-y-4">
        <div className="text-6xl font-bold text-blue-600">{count}</div>
        <Button
          onClick={incrementCounter}
          disabled={!isConnected}
          className="w-full text-lg py-3"
          size="lg"
        >
          Increment Counter
        </Button>
      </div>

      <div className="text-sm text-gray-500 text-center">
        This counter is synchronized across the extension and web app via
        WebSocket
      </div>
    </Card>
  );
}
