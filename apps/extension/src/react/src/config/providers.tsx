import { queryClient } from '@/config/react-query';
import { DashConfig } from '@/config/dash-config';
import { AppSettingsProvider } from '@/hooks/use-app-settings';
import { PortProvider } from '@/hooks/use-port-connection';
import { QueryClientProvider } from '@tanstack/react-query';

export function Providers({ children }: React.PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <PortProvider>
        <AppSettingsProvider>
          <DashConfig>{children}</DashConfig>
        </AppSettingsProvider>
      </PortProvider>
    </QueryClientProvider>
  );
}
