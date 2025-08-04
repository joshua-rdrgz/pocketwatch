import { createContext, useContext, useEffect } from 'react';
import { useTheme } from './use-theme';
import { createMessage } from '@repo/shared/lib/connection';
import {
  Message,
  MessageType,
  TypedMessage,
} from '@repo/shared/types/connection';
import { usePortConnection } from './use-port-connection';

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
        createMessage(MessageType.APP_SETTINGS_SET_THEME, { effectiveTheme })
      );
    },
  });

  // Listen for app settings updates from service worker
  useEffect(() => {
    const handleMessage = (event: CustomEvent<Message>) => {
      const msg = event.detail;
      if (msg.type === MessageType.APP_SETTINGS_UPDATE) {
        const appSettingsMsg = msg as TypedMessage<
          MessageType.APP_SETTINGS_UPDATE,
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
