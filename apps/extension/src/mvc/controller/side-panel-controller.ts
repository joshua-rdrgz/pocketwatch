/* eslint-disable @typescript-eslint/no-explicit-any */
import { createExtensionMessage } from '@repo/shared/lib/connection';
import {
  ExtensionMessage,
  ExtensionMessageType,
  ExtensionRuntimeResponse,
  TypedExtensionMessage as TypedMessage,
} from '@repo/shared/types/extension-connection';
import { SidePanelModel } from '../model/side-panel-model';
import { BasePortController } from './base-port';

type WindowId = number;
type TabId = number;

type SidePanelMessage =
  | TypedMessage<
      ExtensionMessageType.SP_REGISTER_WINDOW,
      { windowId: WindowId; tabId: TabId }
    >
  | TypedMessage<ExtensionMessageType.SP_TOGGLE, { windowId: WindowId }>
  | TypedMessage<ExtensionMessageType.SP_GET_STATE, { windowId: WindowId }>
  | TypedMessage<ExtensionMessageType.SP_CLOSE, undefined>;

export class SidePanelController extends BasePortController {
  private sidePanelModel: SidePanelModel;

  constructor() {
    super();

    this.sidePanelModel = this.registerModel('sidePanel', new SidePanelModel());
    this.setupIconBehavior();
  }

  registerView(port: chrome.runtime.Port) {
    super.registerView(port);

    port.onDisconnect.addListener(() => {
      const windowId = this.sidePanelModel.findWindowIdByPort(port);
      if (windowId !== undefined) {
        this.sidePanelModel.removeWindowPort(windowId);
        this.broadcastSidePanelState(windowId);
      }
    });
  }

  protected handleViewMessage(
    msg: SidePanelMessage,
    port: chrome.runtime.Port
  ): void {
    switch (msg.type) {
      case ExtensionMessageType.SP_REGISTER_WINDOW:
        this.registerWindowConnection(
          msg.payload.windowId,
          msg.payload.tabId,
          port
        );
        break;
      case ExtensionMessageType.SP_TOGGLE:
        this.handleToggleSidePanel(msg.payload.windowId);
        break;
      case ExtensionMessageType.SP_GET_STATE: {
        const isOpen = this.sidePanelModel.getWindowState(msg.payload.windowId);
        port.postMessage(
          createExtensionMessage(ExtensionMessageType.SP_STATE_CHANGED, {
            isOpen,
          })
        );
        break;
      }
      case ExtensionMessageType.SP_CLOSE: { // Handle close from side panel itself
        const windowId = this.sidePanelModel.findWindowIdByPort(port);
        if (windowId !== undefined) {
          this.sidePanelModel.removeWindowPort(windowId);
          this.broadcastSidePanelState(windowId);
        }
        break;
      }
    }
  }

  protected sendInitialState(_port: chrome.runtime.Port): void {
    // Side panel doesn't need initial state broadcast
  }

  protected onModelChange(_modelName: string, _state: any): void {
    // Side panel controller doesn't need to react to model changes
  }

  // Handle runtime messages (from browser panels via chrome.runtime.sendMessage)
  async handleRuntimeMessage(
    message: ExtensionMessage,
    sender: chrome.runtime.MessageSender
  ): Promise<ExtensionRuntimeResponse | null> {
    const windowId = sender.tab?.windowId;
    const tabId = sender.tab?.id;

    if (
      message.type === ExtensionMessageType.SP_TOGGLE ||
      message.type === ExtensionMessageType.SP_GET_STATE
    ) {
      if (tabId && typeof windowId === 'number') {
        switch (message.type) {
          case ExtensionMessageType.SP_TOGGLE:
            this.handleToggleSidePanel(windowId);
            return { success: true };
          case ExtensionMessageType.SP_GET_STATE: {
            const isOpen = this.sidePanelModel.getWindowState(windowId);
            return { success: true, data: { isOpen } };
          }
        }
      } else {
        return {
          success: false,
          error: `Invalid Window ID: ${windowId}, or Invalid Tab ID: ${tabId}`,
        };
      }
    }
    return null; // Not handled by this controller
  }

  private setupIconBehavior() {
    // Configure the side panel to open when the extension icon is clicked
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) =>
        console.error(
          '[SidePanelController] Error configuring side panel:',
          error
        )
      );
  }

  private registerWindowConnection(
    windowId: WindowId,
    tabId: TabId,
    port: chrome.runtime.Port
  ) {
    this.sidePanelModel.registerWindowConnection(windowId, tabId, port);
    this.broadcastSidePanelState(windowId);
  }

  private handleToggleSidePanel(windowId: WindowId) {
    const isOpen = this.sidePanelModel.getWindowState(windowId);

    if (isOpen) {
      const port = this.sidePanelModel.getWindowPort(windowId);
      if (port) {
        port.postMessage(
          createExtensionMessage(ExtensionMessageType.SP_CLOSE, undefined)
        );
      }
    } else {
      chrome.tabs.query({ active: true, windowId }, (tabs) => {
        const tab = tabs[0];
        if (tab?.id) {
          chrome.sidePanel
            .open({ tabId: tab.id })
            .catch((error) =>
              console.error(
                '[SidePanelController] Error opening side panel:',
                error
              )
            );
        }
      });
    }
  }

  private broadcastSidePanelState(windowId: number) {
    const isOpen = this.sidePanelModel.getWindowState(windowId);

    chrome.tabs.query({ windowId }, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          const registeredTabs =
            this.sidePanelModel.getRegisteredTabs(windowId);
          const foundRegisteredTab = registeredTabs.has(tab.id);

          if (foundRegisteredTab) {
            chrome.tabs
              .sendMessage(
                tab.id,
                createExtensionMessage(ExtensionMessageType.SP_STATE_CHANGED, {
                  isOpen,
                })
              )
              .catch((err) => {
                console.error(
                  `[SidePanelController] Failed to broadcast to tab ${tab.id}:`,
                  err
                );
              });
          }
        }
      });
    });
  }
}
