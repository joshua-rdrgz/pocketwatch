import { createExtensionMessage } from '@repo/shared/lib/connection';
import {
  AppSettingsUpdatePayload,
  EffectiveTheme,
  Theme,
} from '@repo/shared/types/app-settings';
import {
  ExtensionMessage,
  ExtensionMessageType,
  TypedExtensionMessage,
} from '@repo/shared/types/extension-connection';
import { createContext, useContext, useEffect } from 'react';
import { usePortConnection } from './use-port-connection';
import { useTheme } from './use-theme';

interface AppSettingsContextType {
  effectiveTheme: EffectiveTheme;
  toggleTheme(): void;
}

const AppSettingsContext = createContext<AppSettingsContextType | null>(null);

export function AppSettingsProvider({ children }: React.PropsWithChildren) {
  const { portRef, sendMessage, isConnected } = usePortConnection();

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
    const port = portRef.current;
    if (!port) return;

    const handleMessage = (msg: ExtensionMessage) => {
      if (msg.type === ExtensionMessageType.APP_SETTINGS_UPDATE) {
        const appSettingsMsg = msg as TypedExtensionMessage<
          ExtensionMessageType.APP_SETTINGS_UPDATE,
          AppSettingsUpdatePayload
        >;
        setTheme(appSettingsMsg.payload.effectiveTheme as Theme);
      }
    };

    port.onMessage.addListener(handleMessage);

    return () => {
      port.onMessage.removeListener(handleMessage);
    };
  }, [portRef, setTheme, isConnected]);

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
