export type Theme = 'dark' | 'light' | 'system';

export type EffectiveTheme = Omit<Theme, 'system'>;

// Type for APP_SETTINGS_UPDATE message payload
export interface AppSettingsUpdatePayload {
  effectiveTheme: EffectiveTheme;
}
