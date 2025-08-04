import { createMessage } from '@repo/shared/lib/connection';
import { Message, MessageType } from '@repo/shared/types/connection';

type EffectiveTheme = 'light' | 'dark';

interface EffectiveThemePayload {
  effectiveTheme: EffectiveTheme;
}

interface AppSettingsServiceOptions {
  onUpdate?(message: Message<EffectiveThemePayload>): void;
}

export class AppSettingsService {
  private effectiveTheme: EffectiveTheme = 'light';

  private onUpdate?: (message: Message<EffectiveThemePayload>) => void;

  constructor({ onUpdate }: AppSettingsServiceOptions) {
    this.onUpdate = onUpdate;
  }

  registerPort(port: chrome.runtime.Port) {
    this.sendUpdate(port);

    port.onMessage.addListener((msg: Message<EffectiveThemePayload>) => {
      switch (msg.type) {
        case MessageType.APP_SETTINGS_SET_THEME:
          this.setEffectiveTheme(msg.payload?.effectiveTheme);
          break;
      }
    });
  }

  private setEffectiveTheme(effTheme?: EffectiveTheme) {
    this.effectiveTheme = effTheme || 'light';
    this.sendUpdate();
  }

  private sendUpdate(port?: chrome.runtime.Port) {
    const message = createMessage(MessageType.APP_SETTINGS_UPDATE, {
      effectiveTheme: this.effectiveTheme,
    });

    if (port) {
      port.postMessage(message);
    } else {
      this.onUpdate?.(message);
    }
  }
}
