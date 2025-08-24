import { createExtensionMessage } from '@repo/shared/lib/connection';
import {
  AppSettingsUpdatePayload,
  EffectiveTheme,
} from '@repo/shared/types/app-settings';
import {
  ExtensionMessage,
  ExtensionMessageType,
} from '@repo/shared/types/extension-connection';

interface AppSettingsServiceOptions {
  onUpdate?(message: ExtensionMessage<AppSettingsUpdatePayload>): void;
}

export class AppSettingsService {
  private effectiveTheme: EffectiveTheme = 'light';

  private onUpdate?: (
    message: ExtensionMessage<AppSettingsUpdatePayload>
  ) => void;

  constructor({ onUpdate }: AppSettingsServiceOptions) {
    this.onUpdate = onUpdate;
  }

  registerPort(port: chrome.runtime.Port) {
    this.sendUpdate(port);

    port.onMessage.addListener(
      (msg: ExtensionMessage<AppSettingsUpdatePayload>) => {
        switch (msg.type) {
          case ExtensionMessageType.APP_SETTINGS_SET_THEME:
            console.log(
              '[app-settings-service] Effective Theme Set: ',
              msg.payload?.effectiveTheme
            );
            this.setEffectiveTheme(msg.payload?.effectiveTheme);
            break;
        }
      }
    );
  }

  private setEffectiveTheme(effTheme?: EffectiveTheme) {
    this.effectiveTheme = effTheme || 'light';
    this.sendUpdate();
  }

  private sendUpdate(port?: chrome.runtime.Port) {
    const updatedAppSettings: AppSettingsUpdatePayload = {
      effectiveTheme: this.effectiveTheme,
    };

    const message = createExtensionMessage(
      ExtensionMessageType.APP_SETTINGS_UPDATE,
      updatedAppSettings
    );

    if (port) {
      port.postMessage(message);
    } else {
      this.onUpdate?.(message);
    }
  }
}
