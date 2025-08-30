/* eslint-disable @typescript-eslint/no-explicit-any */
import { createExtensionMessage } from '@repo/shared/lib/connection';
import { AppSettingsUpdatePayload } from '@repo/shared/types/app-settings';
import {
  ExtensionMessageType,
  TypedExtensionMessage as TypedMessage,
} from '@repo/shared/types/extension-connection';
import { AppSettingsModel } from '../model/app-settings-model';
import { BasePortController } from './base-port';

type AppSettingsMessage = TypedMessage<
  ExtensionMessageType.APP_SETTINGS_SET_THEME,
  AppSettingsUpdatePayload
>;

export class AppSettingsController extends BasePortController {
  private appSettingsModel: AppSettingsModel;

  constructor() {
    super();

    this.appSettingsModel = this.registerModel(
      'appSettings',
      new AppSettingsModel()
    );
  }

  protected handleViewMessage(
    msg: AppSettingsMessage,
    _port: chrome.runtime.Port
  ): void {
    switch (msg.type) {
      case ExtensionMessageType.APP_SETTINGS_SET_THEME:
        console.log(
          '[app-settings-controller] Effective Theme Set: ',
          msg.payload?.effectiveTheme
        );
        if (msg.payload?.effectiveTheme) {
          this.appSettingsModel.setEffectiveTheme(msg.payload.effectiveTheme);
        }
        break;
    }
  }

  protected sendInitialState(port: chrome.runtime.Port): void {
    const state = this.appSettingsModel.getState();
    const updatePayload: AppSettingsUpdatePayload = {
      effectiveTheme: state.effectiveTheme,
    };

    const message = createExtensionMessage(
      ExtensionMessageType.APP_SETTINGS_UPDATE,
      updatePayload
    );

    port.postMessage(message);
  }

  protected onModelChange(_modelName: string, state: any): void {
    const updatePayload: AppSettingsUpdatePayload = {
      effectiveTheme: state.effectiveTheme,
    };

    const message = createExtensionMessage(
      ExtensionMessageType.APP_SETTINGS_UPDATE,
      updatePayload
    );

    // Broadcast to all connected views
    this.broadcastToViews(message);
  }
}
