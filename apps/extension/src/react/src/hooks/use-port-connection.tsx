import { Message, PortName } from '@repo/shared/types/connection';
import { createContext, useContext, useEffect, useRef } from 'react';

interface PortContextType {
  portRef: React.RefObject<chrome.runtime.Port | null>;
  sendMessage: (message: Message) => void;
}

const PortContext = createContext<PortContextType | null>(null);

export function PortProvider({ children }: React.PropsWithChildren) {
  const portRef = useRef<chrome.runtime.Port | null>(null);

  useEffect(() => {
    const port = chrome.runtime.connect({ name: PortName.POCKETWATCH });
    portRef.current = port;

    // Global message handler - routes messages to appropriate listeners
    port.onMessage.addListener((msg: Message) => {
      // Dispatch custom events for different message types
      // This allows individual hooks to listen for their specific messages
      const event = new CustomEvent('port-message', { detail: msg });
      window.dispatchEvent(event);
    });

    port.onDisconnect.addListener(() => {
      portRef.current = null;
    });

    return () => {
      if (portRef.current) {
        portRef.current.disconnect();
        portRef.current = null;
      }
    };
  }, []); // Empty dependency array - connection created only once

  const sendMessage = (message: Message) => {
    if (portRef.current) {
      portRef.current.postMessage(message);
    } else {
      console.warn(
        '[PortProvider] Attempted to send message but port is not connected'
      );
    }
  };

  const value: PortContextType = {
    portRef,
    sendMessage,
  };

  return <PortContext.Provider value={value}>{children}</PortContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePortConnection() {
  const context = useContext(PortContext);
  if (!context) {
    throw new Error('usePortConnection must be used within a PortProvider');
  }
  return context;
}
