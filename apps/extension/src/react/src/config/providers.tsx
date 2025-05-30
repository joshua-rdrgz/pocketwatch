import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
// import { queryClient } from './react-query';
import { AppSettingsProvider } from '@/hooks/use-app-settings';
import { StopwatchProvider } from '@/hooks/use-stopwatch';

export function Providers({ children }: React.PropsWithChildren) {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <AppSettingsProvider>
        <StopwatchProvider>{children}</StopwatchProvider>
      </AppSettingsProvider>
    </QueryClientProvider>
  );
}
