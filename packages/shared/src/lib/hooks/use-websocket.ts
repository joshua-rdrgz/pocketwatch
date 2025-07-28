import { useCallback, useEffect, useRef, useState } from 'react';

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
  } = options;

  const [isConnected, setIsConnected] = useState(false);
  const ws = useRef<WebSocket | null>(null);
  const reconnectTimeout = useRef<NodeJS.Timeout | null>(null);
  const shouldReconnect = useRef(true);
  const connectAttempts = useRef(0);

  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
      reconnectTimeout.current = null;
    }
  }, []);

  const connect = useCallback(() => {
    connectAttempts.current++;

    if (ws.current?.readyState === WebSocket.OPEN) {
      return;
    }

    if (ws.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      // Close existing connection if any
      if (ws.current) {
        ws.current.close();
      }

      ws.current = new WebSocket(url);

      ws.current.onopen = () => {
        setIsConnected(true);
        clearReconnectTimeout();
        onOpen?.();
      };

      ws.current.onmessage = (event: MessageEvent) => {
        try {
          const message = JSON.parse(event.data) as TMessage;
          onMessage?.(message);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      ws.current.onclose = (_event: CloseEvent) => {
        setIsConnected(false);
        onClose?.();

        if (autoReconnect && shouldReconnect.current) {
          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, reconnectInterval);
        }
      };

      ws.current.onerror = (error: Event) => {
        setIsConnected(false);
        onError?.(error);
      };
    } catch (error: unknown) {
      setIsConnected(false);

      if (autoReconnect && shouldReconnect.current) {
        reconnectTimeout.current = setTimeout(() => {
          connect();
        }, reconnectInterval);
      }
    }
  }, [
    url,
    onMessage,
    onOpen,
    onClose,
    onError,
    autoReconnect,
    reconnectInterval,
    clearReconnectTimeout,
  ]);

  const sendMessage = useCallback((message: TMessage) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      try {
        const messageStr = JSON.stringify(message);
        ws.current.send(messageStr);
      } catch (error) {
        console.error('Error sending WebSocket message:', error);
      }
    } else {
      console.warn('WebSocket not connected, cannot send message:', message);
    }
  }, []);

  const reconnect = useCallback(() => {
    clearReconnectTimeout();
    if (ws.current) {
      ws.current.close();
    }
    connect();
  }, [connect, clearReconnectTimeout]);

  const disconnect = useCallback(() => {
    shouldReconnect.current = false;
    clearReconnectTimeout();
    if (ws.current) {
      ws.current.close();
    }
  }, [clearReconnectTimeout]);

  useEffect(() => {
    shouldReconnect.current = true;
    connect();

    return () => {
      shouldReconnect.current = false;
      clearReconnectTimeout();
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url, clearReconnectTimeout, connect]);

  return {
    isConnected,
    sendMessage,
    reconnect,
    disconnect,
  };
}
