import { EffectiveTheme } from '@repo/shared/types/app-settings';
import { BaseModel } from './base';

interface AppSettingsState {
  effectiveTheme: EffectiveTheme;
}

const initialAppSettingsState: AppSettingsState = {
  effectiveTheme: 'light',
};

export class AppSettingsModel extends BaseModel<AppSettingsState> {
  constructor() {
    super(initialAppSettingsState);
  }

  setEffectiveTheme(theme: EffectiveTheme) {
    this.setState({ effectiveTheme: theme });
  }

  getEffectiveTheme(): EffectiveTheme {
    return this.getState().effectiveTheme;
  }
}
