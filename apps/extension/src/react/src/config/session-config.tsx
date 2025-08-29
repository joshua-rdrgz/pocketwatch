import { usePortConnection } from '@/hooks/use-port-connection';
import { useSessionStore } from '@/stores/session-store';
import {
  ExtensionMessage,
  ExtensionMessageType,
  TypedExtensionMessage,
} from '@repo/shared/types/extension-connection';
import { SessionUpdatePayload } from '@repo/shared/types/session';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export function SessionConfig({ children }: React.PropsWithChildren) {
  const { portRef, sendMessage, isConnected } = usePortConnection();
  const { setSendMessage, syncSession } = useSessionStore();

  /**
   * Listen for SESSION_UPDATE messages and update the session store accordingly.
   */
  useEffect(() => {
    const port = portRef.current;
    if (!port) return;

    const handleMessage = (msg: ExtensionMessage) => {
      if (msg.type === ExtensionMessageType.SESSION_SYNC) {
        if (msg.error) {
          toast.error(`WebSocket error: ${msg.error}`);
          return;
        }

        const sessionMsg = msg as TypedExtensionMessage<
          ExtensionMessageType.SESSION_SYNC,
          SessionUpdatePayload
        >;
        syncSession(sessionMsg.payload);
      }
    };

    port.onMessage.addListener(handleMessage);

    return () => {
      port.onMessage.removeListener(handleMessage);
    };
  }, [portRef, syncSession, isConnected]);

  // Set sendMessage in the store when it becomes available
  useEffect(() => {
    setSendMessage(sendMessage);
  }, [sendMessage, setSendMessage]);

  // Wrap functionality in component instead of
  // custom hook to let "usePortConnection" work
  // within its context boundaries
  return <>{children}</>;
}
