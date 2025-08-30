import { queryClient } from '@/config/react-query';
import { SessionConfig } from '@/config/session-config';
import { AppSettingsProvider } from '@/hooks/use-app-settings';
import { PortProvider } from '@/hooks/use-port-connection';
import { QueryClientProvider } from '@tanstack/react-query';

export function Providers({ children }: React.PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <PortProvider>
        <AppSettingsProvider>
          <SessionConfig>{children}</SessionConfig>
        </AppSettingsProvider>
      </PortProvider>
    </QueryClientProvider>
  );
}
