/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ExtensionMessage,
  ExtensionRuntimeResponse,
} from '@repo/shared/types/extension-connection';
import { BaseModel } from '../model/base';

export abstract class BaseRuntimeController {
  protected models: Map<string, BaseModel> = new Map();

  async handleRuntimeMessage(
    msg: ExtensionMessage,
    sender: chrome.runtime.MessageSender
  ): Promise<ExtensionRuntimeResponse | null> {
    return this.handleMessage(msg, sender);
  }

  protected abstract handleMessage(
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender
  ): Promise<ExtensionRuntimeResponse | null>;

  protected broadcast(msg: ExtensionMessage) {
    chrome.runtime.sendMessage(msg);
  }

  protected registerModel<T extends BaseModel>(name: string, model: T): T {
    this.models.set(name, model);

    // Subscribe to model changes
    model.subscribe((state) => {
      this.onModelChange(name, state);
    });

    return model;
  }

  protected abstract onModelChange(modelName: string, state: any): void;
}
