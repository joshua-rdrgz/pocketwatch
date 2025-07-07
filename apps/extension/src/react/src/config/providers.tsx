import { queryClient } from '@/config/react-query';
import { AppSettingsProvider } from '@/hooks/use-app-settings';
import { StopwatchProvider } from '@/hooks/use-stopwatch';
import { QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/hooks/use-theme';

export function Providers({ children }: React.PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <AppSettingsProvider>
        <StopwatchProvider>
          <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
            {children}
          </ThemeProvider>
        </StopwatchProvider>
      </AppSettingsProvider>
    </QueryClientProvider>
  );
}
