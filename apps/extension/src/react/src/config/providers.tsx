import { queryClient } from '@/config/react-query';
import { AppSettingsProvider } from '@/hooks/use-app-settings';
import { StopwatchProvider } from '@/hooks/use-stopwatch';
import { QueryClientProvider } from '@tanstack/react-query';

export function Providers({ children }: React.PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppSettingsProvider>
        <StopwatchProvider>{children}</StopwatchProvider>
      </AppSettingsProvider>
    </QueryClientProvider>
  );
}
