import { usePortConnection } from '@/hooks/use-port-connection';
import { useSessionListener } from '@/hooks/use-session-listener';
import { useSessionStore } from '@/stores/session-store';
import { useEffect } from 'react';

export function SessionConfig({ children }: React.PropsWithChildren) {
  const { sendMessage } = usePortConnection();
  const setSendMessage = useSessionStore((state) => state.setSendMessage);

  useSessionListener();

  // Set sendMessage in the store when it becomes available
  useEffect(() => {
    setSendMessage(sendMessage);
  }, [sendMessage, setSendMessage]);

  // Wrap functionality in component instead of
  // custom hook to let "usePortConnection" work
  // within its context boundaries
  return <>{children}</>;
}
