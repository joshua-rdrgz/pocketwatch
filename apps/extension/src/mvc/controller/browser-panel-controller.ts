/* eslint-disable @typescript-eslint/no-explicit-any */
import { createExtensionMessage } from '@repo/shared/lib/connection';
import {
  ExtensionMessageType,
  TypedExtensionMessage as TypedMessage,
} from '@repo/shared/types/extension-connection';
import { BrowserPanelModel, PanelPosition } from '../model/browser-panel-model';
import { BasePortController } from './base-port';

type TabId = number;

type BrowserPanelMessage =
  | TypedMessage<ExtensionMessageType.BP_SET_MINIMIZED, boolean>
  | TypedMessage<ExtensionMessageType.BP_SET_POSITION, PanelPosition>
  | TypedMessage<ExtensionMessageType.BP_GET_MINIMIZED, undefined>
  | TypedMessage<ExtensionMessageType.BP_GET_POSITION, undefined>;

export class BrowserPanelController extends BasePortController {
  private browserPanelModel: BrowserPanelModel;

  constructor() {
    super();

    this.browserPanelModel = this.registerModel(
      'browserPanel',
      new BrowserPanelModel()
    );
  }

  registerView(port: chrome.runtime.Port) {
    // Initialize state for this tab if it has a sender tab ID
    if (port.sender?.tab?.id !== undefined) {
      const tabId = port.sender.tab.id;
      this.browserPanelModel.initializeTabState(tabId);
    }

    super.registerView(port);
  }

  protected handleViewMessage(
    msg: BrowserPanelMessage,
    port: chrome.runtime.Port
  ): void {
    const tabId = port.sender?.tab?.id;
    if (tabId === undefined) return;

    switch (msg.type) {
      case ExtensionMessageType.BP_SET_MINIMIZED:
        this.browserPanelModel.setMinimized(tabId, msg.payload);
        this.sendUpdate(port, tabId);
        break;
      case ExtensionMessageType.BP_SET_POSITION:
        this.browserPanelModel.setPosition(tabId, msg.payload);
        this.sendUpdate(port, tabId);
        break;
      case ExtensionMessageType.BP_GET_MINIMIZED:
        port.postMessage(
          createExtensionMessage(
            ExtensionMessageType.BP_SET_MINIMIZED,
            this.browserPanelModel.getMinimized(tabId)
          )
        );
        break;
      case ExtensionMessageType.BP_GET_POSITION:
        port.postMessage(
          createExtensionMessage(
            ExtensionMessageType.BP_SET_POSITION,
            this.browserPanelModel.getPosition(tabId)
          )
        );
        break;
    }
  }

  protected sendInitialState(port: chrome.runtime.Port): void {
    const tabId = port.sender?.tab?.id;
    if (tabId === undefined) return;

    const initialState = this.browserPanelModel.getTabState(tabId);
    if (initialState) {
      port.postMessage(
        createExtensionMessage(ExtensionMessageType.BP_UPDATE, {
          isMinimized: initialState.isMinimized,
          position: initialState.position,
          initial: true,
        })
      );
    }
  }

  protected onModelChange(_modelName: string, _state: any): void {
    // No model changes to react to
  }

  private sendUpdate(port: chrome.runtime.Port, tabId: TabId) {
    const state = this.browserPanelModel.getTabState(tabId);

    if (state) {
      port.postMessage(
        createExtensionMessage(ExtensionMessageType.BP_UPDATE, {
          isMinimized: state.isMinimized,
          position: state.position,
          initial: false,
        })
      );
    }
  }
}
