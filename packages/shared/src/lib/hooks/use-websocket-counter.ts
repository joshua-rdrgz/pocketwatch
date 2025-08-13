import { useCallback, useState } from 'react';
// Counter demo message types
type CounterMessage =
  | { type: 'INCREMENT' }
  | { type: 'GET_COUNT' }
  | { type: 'COUNT_UPDATE'; count: number };
import { useWebSocket } from './use-websocket';

export interface UseWebSocketCounterOptions {
  /** WebSocket URL for the counter endpoint (default: 'ws://localhost:3001/api/ws/counter') */
  url?: string;
}

export interface UseWebSocketCounterReturn {
  /** Current counter value */
  count: number;
  /** Whether the WebSocket is connected */
  isConnected: boolean;
  /** Increment the counter */
  incrementCounter: () => void;
  /** Get the current count from server */
  getCount: () => void;
  /** Manually reconnect */
  reconnect: () => void;
  /** Disconnect */
  disconnect: () => void;
}

export function useWebSocketCounter(
  options: UseWebSocketCounterOptions = {}
): UseWebSocketCounterReturn {
  const { url = 'ws://localhost:3001/api/ws/counter' } = options;

  const [count, setCount] = useState(0);

  const { sendMessage, ...restWebSocket } = useWebSocket<CounterMessage>({
    url,
    onMessage: useCallback((message: CounterMessage) => {
      if (
        message.type === 'COUNT_UPDATE' &&
        typeof message.count === 'number'
      ) {
        setCount(message.count);
      }
    }, []),
  });

  const incrementCounter = useCallback(() => {
    sendMessage({ type: 'INCREMENT' });
  }, [sendMessage]);

  const getCount = useCallback(() => {
    sendMessage({ type: 'GET_COUNT' });
  }, [sendMessage]);

  return {
    count,
    incrementCounter,
    getCount,
    ...restWebSocket,
  };
}
