/* eslint-disable @typescript-eslint/no-explicit-any */
import { ExtensionMessage } from '@repo/shared/types/extension-connection';
import { BaseModel } from '../model/base';

export abstract class BasePortController {
  protected models: Map<string, BaseModel> = new Map();
  protected views: Set<chrome.runtime.Port> = new Set();

  registerView(port: chrome.runtime.Port) {
    this.views.add(port);

    this.sendInitialState(port);

    port.onMessage.addListener((msg) => this.handleViewMessage(msg, port));

    port.onDisconnect.addListener(() => this.views.delete(port));
  }

  protected abstract handleViewMessage(
    message: any,
    port: chrome.runtime.Port
  ): void;
  protected abstract sendInitialState(port: chrome.runtime.Port): void;

  protected broadcastToViews(msg: ExtensionMessage) {
    this.views.forEach((p) => p.postMessage(msg));
  }

  protected registerModel<T extends BaseModel>(name: string, model: T): T {
    this.models.set(name, model);

    // Subcribe to model changes
    model.subscribe((state) => {
      this.onModelChange(name, state);
    });

    return model;
  }

  protected abstract onModelChange(modelName: string, state: any): void;
}
