import { createContext, useContext, useEffect, useRef } from 'react';
import { useTheme } from './use-theme';

type Theme = 'dark' | 'light' | 'system';

type EffectiveTheme = Omit<Theme, 'system'>;

interface AppSettingsContextType {
  effectiveTheme: EffectiveTheme;
  toggleTheme(): void;
}

const AppSettingsContext = createContext<AppSettingsContextType | null>(null);

export function AppSettingsProvider({ children }: React.PropsWithChildren) {
  const portRef = useRef<chrome.runtime.Port | null>(null);

  const { effectiveTheme, setTheme, toggleTheme } = useTheme({
    onThemeChange: (theme) => {
      portRef.current?.postMessage({
        action: 'setTheme',
        value: theme,
      });
    },
  });

  // Sync Service Worker w/UI State
  useEffect(() => {
    const port = chrome.runtime.connect({ name: 'appSettings' });
    portRef.current = port;

    // Listen for updates
    port.onMessage.addListener((msg) => {
      if (msg.type === 'update') {
        setTheme(msg.effectiveTheme);
      }
    });

    // Effect Clean Up
    return () => {
      port.disconnect();
      portRef.current = null;
    };
  }, [setTheme]);

  const value: AppSettingsContextType = {
    effectiveTheme,
    toggleTheme,
  };

  return (
    <AppSettingsContext.Provider value={value}>
      {children}
    </AppSettingsContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAppSettings() {
  const context = useContext(AppSettingsContext);
  if (!context) {
    throw new Error('useAppSettings must be used within a AppSettingsProvider');
  }
  return context;
}
