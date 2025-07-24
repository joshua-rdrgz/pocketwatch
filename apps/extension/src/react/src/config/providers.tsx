import { queryClient } from '@/config/react-query';
import { AppSettingsProvider } from '@/hooks/use-app-settings';
import { SessionProvider } from '@/hooks/use-session';
import { StopwatchProvider } from '@/hooks/use-stopwatch';
import { QueryClientProvider } from '@tanstack/react-query';

export function Providers({ children }: React.PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppSettingsProvider>
        <SessionProvider>
          <StopwatchProvider>{children}</StopwatchProvider>
        </SessionProvider>
      </AppSettingsProvider>
    </QueryClientProvider>
  );
}
