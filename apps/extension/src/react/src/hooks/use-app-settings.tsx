import { createExtensionMessage } from '@repo/shared/lib/connection';
import {
  ExtensionMessage,
  ExtensionMessageType,
  TypedExtensionMessage,
} from '@repo/shared/types/connection';
import { createContext, useContext, useEffect } from 'react';
import { usePortConnection } from './use-port-connection';
import { useTheme } from './use-theme';

type Theme = 'dark' | 'light' | 'system';

type EffectiveTheme = Omit<Theme, 'system'>;

// Type for APP_SETTINGS_UPDATE message payload
interface AppSettingsUpdatePayload {
  effectiveTheme: EffectiveTheme;
}

interface AppSettingsContextType {
  effectiveTheme: EffectiveTheme;
  toggleTheme(): void;
}

const AppSettingsContext = createContext<AppSettingsContextType | null>(null);

export function AppSettingsProvider({ children }: React.PropsWithChildren) {
  const { sendMessage } = usePortConnection();

  const { effectiveTheme, setTheme, toggleTheme } = useTheme({
    onThemeChange: (effectiveTheme) => {
      sendMessage(
        createExtensionMessage(ExtensionMessageType.APP_SETTINGS_SET_THEME, {
          effectiveTheme,
        })
      );
    },
  });

  // Listen for app settings updates from service worker
  useEffect(() => {
    const handleMessage = (event: CustomEvent<ExtensionMessage>) => {
      const msg = event.detail;
      if (msg.type === ExtensionMessageType.APP_SETTINGS_UPDATE) {
        const appSettingsMsg = msg as TypedExtensionMessage<
          ExtensionMessageType.APP_SETTINGS_UPDATE,
          AppSettingsUpdatePayload
        >;
        setTheme(appSettingsMsg.payload.effectiveTheme as Theme);
      }
    };

    window.addEventListener('port-message', handleMessage as EventListener);

    return () => {
      window.removeEventListener(
        'port-message',
        handleMessage as EventListener
      );
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
