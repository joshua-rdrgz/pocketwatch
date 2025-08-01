import { useCallback, useEffect, useRef, useState } from 'react';
import { createWebSocketTransport } from '../transports/transport-factory';
import type { WebSocketTransport } from '../../types/websocket-transport';

export interface UseWebSocketOptions<TMessage = unknown> {
  /** WebSocket URL to connect to */
  url: string;
  /** Callback for handling incoming messages */
  onMessage?: (message: TMessage) => void;
  /** Callback for connection open */
  onOpen?: () => void;
  /** Callback for connection close */
  onClose?: () => void;
  /** Callback for connection error */
  onError?: (error: Event) => void;
  /** Auto-reconnect on disconnect (default: true) */
  autoReconnect?: boolean;
  /** Reconnect interval in milliseconds (default: 3000) */
  reconnectInterval?: number;
  /** Custom transport (for testing or special cases) */
  transport?: WebSocketTransport;
}

export interface UseWebSocketReturn<TMessage = unknown> {
  /** Whether the WebSocket is currently connected */
  isConnected: boolean;
  /** Send a message through the WebSocket */
  sendMessage: (message: TMessage) => void;
  /** Manually reconnect the WebSocket */
  reconnect: () => void;
  /** Close the WebSocket connection */
  disconnect: () => void;
}

export function useWebSocket<TMessage = unknown>(
  options: UseWebSocketOptions<TMessage>
): UseWebSocketReturn<TMessage> {
  const {
    url,
    onMessage,
    onOpen,
    onClose,
    onError,
    autoReconnect = true,
    reconnectInterval = 3000,
    transport: customTransport,
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const transportRef = useRef<WebSocketTransport | null>(null);

  // Create transport if not provided
  useEffect(() => {
    if (customTransport) {
      transportRef.current = customTransport;
    } else {
      transportRef.current = createWebSocketTransport({
        url,
        autoReconnect,
        reconnectInterval,
      });
    }

    const transport = transportRef.current;

    // Set up callbacks
    transport.onOpen(() => {
      setIsConnected(true);
      onOpen?.();
    });

    transport.onClose(() => {
      setIsConnected(false);
      onClose?.();
    });

    transport.onMessage((message) => {
      onMessage?.(message as TMessage);
    });

    transport.onError((error) => {
      setIsConnected(false);
      onError?.(error as Event);
    });

    // Connect
    transport.connect();

    return () => {
      transport.disconnect();
    };
  }, [
    url,
    onMessage,
    onOpen,
    onClose,
    onError,
    autoReconnect,
    reconnectInterval,
    customTransport,
  ]);

  const sendMessage = useCallback((message: TMessage) => {
    transportRef.current?.send(message);
  }, []);

  const reconnect = useCallback(() => {
    transportRef.current?.reconnect();
  }, []);

  const disconnect = useCallback(() => {
    transportRef.current?.disconnect();
  }, []);

  return {
    isConnected,
    sendMessage,
    reconnect,
    disconnect,
  };
}
