import { usePortConnection } from '@/hooks/use-port-connection';
import { useDashStore } from '@/stores/dash-store';
import {
  ExtensionMessage,
  ExtensionMessageType,
  TypedExtensionMessage,
} from '@repo/shared/types/extension-connection';
import { DashUpdatePayload } from '@repo/shared/types/dash';
import { useEffect } from 'react';
import { toast } from 'react-hot-toast';

export function DashConfig({ children }: React.PropsWithChildren) {
  const { portRef, sendMessage, isConnected } = usePortConnection();
  const { setSendMessage, syncDash } = useDashStore();

  /**
   * Listen for DASH_UPDATE messages and update the dash store accordingly.
   */
  useEffect(() => {
    const port = portRef.current;
    if (!port) return;

    const handleMessage = (msg: ExtensionMessage) => {
      if (msg.type === ExtensionMessageType.DASH_SYNC) {
        if (msg.error) {
          toast.error(`WebSocket error: ${msg.error}`);
          return;
        }

        const dashMsg = msg as TypedExtensionMessage<
          ExtensionMessageType.DASH_SYNC,
          DashUpdatePayload
        >;
        syncDash(dashMsg.payload);
      }
    };

    port.onMessage.addListener(handleMessage);

    return () => {
      port.onMessage.removeListener(handleMessage);
    };
  }, [portRef, syncDash, isConnected]);

  // Set sendMessage in the store when it becomes available
  useEffect(() => {
    setSendMessage(sendMessage);
  }, [sendMessage, setSendMessage]);

  // Wrap functionality in component instead of
  // custom hook to let "usePortConnection" work
  // within its context boundaries
  return <>{children}</>;
}
