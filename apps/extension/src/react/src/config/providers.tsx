import { queryClient } from '@/config/react-query';
import { AppSettingsProvider } from '@/hooks/use-app-settings';
import { SessionProvider } from '@/hooks/use-session';
import { PortProvider } from '@/hooks/use-port-connection';
import { QueryClientProvider } from '@tanstack/react-query';

export function Providers({ children }: React.PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <PortProvider>
        <AppSettingsProvider>
          <SessionProvider>{children}</SessionProvider>
        </AppSettingsProvider>
      </PortProvider>
    </QueryClientProvider>
  );
}
