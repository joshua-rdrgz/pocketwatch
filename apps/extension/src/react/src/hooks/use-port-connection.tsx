import {
  ExtensionMessage,
  PortName,
} from '@repo/shared/types/extension-connection';
import { createContext, useContext, useEffect, useRef, useState } from 'react';

interface PortContextType {
  portRef: React.RefObject<chrome.runtime.Port | null>;
  sendMessage: (message: ExtensionMessage) => void;
  isConnected: boolean;
}

const PortContext = createContext<PortContextType | null>(null);

export function PortProvider({ children }: React.PropsWithChildren) {
  const portRef = useRef<chrome.runtime.Port | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const port = chrome.runtime.connect({ name: PortName.POCKETWATCH });
    portRef.current = port;
    setIsConnected(true);

    port.onDisconnect.addListener(() => {
      portRef.current = null;
      setIsConnected(false);
    });

    return () => {
      if (portRef.current) {
        portRef.current.disconnect();
        portRef.current = null;
        setIsConnected(false);
      }
    };
  }, []);

  const sendMessage = (message: ExtensionMessage) => {
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
    isConnected,
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
