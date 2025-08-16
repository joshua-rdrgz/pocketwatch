import { createExtensionMessage } from '@repo/shared/lib/connection';
import {
  ExtensionMessage as Message,
  ExtensionMessageType as MessageType,
  TypedExtensionMessage as TypedMessage,
} from '@repo/shared/types/extension-connection';

type WindowId = number;
type TabId = number;

type SidePanelMessage =
  | TypedMessage<
      MessageType.SP_REGISTER_WINDOW,
      { windowId: WindowId; tabId: TabId }
    >
  | TypedMessage<MessageType.SP_TOGGLE, { windowId: WindowId }>
  | TypedMessage<MessageType.SP_GET_STATE, { windowId: WindowId }>
  | TypedMessage<MessageType.SP_CLOSE, undefined>;

// Runtime message response types
type SidePanelRuntimeResponse =
  | { success: true }
  | { isOpen: boolean }
  | { error: string }
  | null;

export class SidePanelService {
  // { [WindowId]: isOpen } => Indicates which windows have the side panel open
  private windowStates: Map<WindowId, boolean> = new Map();

  // { [WindowId]: Port } => Maps established WindowIds with their respective ports
  private windowPorts: Map<WindowId, chrome.runtime.Port> = new Map();

  // { [WindowId]: TabId[] } => Maps established WindowIds with all registered TabIds
  private registeredTabsByWindow: Map<WindowId, Set<TabId>> = new Map();

  constructor() {
    this.setupIconBehavior();
  }

  registerPort(port: chrome.runtime.Port) {
    // Handle side panel port connections (SP_POCKETWATCH)
    port.onMessage.addListener((msg) => this.handleMessage(port, msg));

    port.onDisconnect.addListener(() => {
      // Find and clean up the window associated with this port
      for (const [windowId, windowPort] of this.windowPorts.entries()) {
        if (windowPort === port) {
          this.windowStates.set(windowId, false);
          this.windowPorts.delete(windowId);
          this.broadcastSidePanelState(windowId);
          break;
        }
      }
    });
  }

  // Handle runtime messages (from content scripts/browser panels)
  handleMessage(port: chrome.runtime.Port, msg: SidePanelMessage) {
    switch (msg.type) {
      case MessageType.SP_REGISTER_WINDOW:
        this.registerWindowConnection(
          msg.payload.windowId,
          msg.payload.tabId,
          port
        );
        break;
      case MessageType.SP_TOGGLE:
        this.handleToggleSidePanel(msg.payload.windowId);
        break;
      case MessageType.SP_GET_STATE: {
        const isOpen = this.windowStates.get(msg.payload.windowId) || false;
        port.postMessage(
          createExtensionMessage(MessageType.SP_STATE_CHANGED, { isOpen })
        );
        break;
      }
      case MessageType.SP_CLOSE:
        // Handle close from side panel itself
        for (const [windowId, windowPort] of this.windowPorts.entries()) {
          if (windowPort === port) {
            this.windowStates.set(windowId, false);
            this.windowPorts.delete(windowId);
            this.broadcastSidePanelState(windowId);
            break;
          }
        }
        break;
    }
  }

  // Handle runtime messages (from browser panels via chrome.runtime.sendMessage)
  handleRuntimeMessage(
    message: Message,
    sender: chrome.runtime.MessageSender
  ): SidePanelRuntimeResponse {
    const windowId = sender.tab?.windowId;
    const tabId = sender.tab?.id;

    if (
      message.type === MessageType.SP_TOGGLE ||
      message.type === MessageType.SP_GET_STATE
    ) {
      if (tabId && typeof windowId === 'number') {
        switch (message.type) {
          case MessageType.SP_TOGGLE:
            this.handleToggleSidePanel(windowId);
            return { success: true };
          case MessageType.SP_GET_STATE: {
            const isOpen = this.windowStates.get(windowId) || false;
            return { isOpen };
          }
        }
      } else {
        return {
          error: `Invalid Window ID: ${windowId}, or Invalid Tab ID: ${tabId}`,
        };
      }
    }
    return null; // Not handled by this service
  }

  private setupIconBehavior() {
    // Configure the side panel to open when the extension icon is clicked
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) =>
        console.error('[SidePanelService] Error configuring side panel:', error)
      );
  }

  private registerWindowConnection(
    windowId: WindowId,
    tabId: TabId,
    port: chrome.runtime.Port
  ) {
    this.windowStates.set(windowId, true);
    this.windowPorts.set(windowId, port);
    this.registeredTabsByWindow.set(
      windowId,
      new Set([...(this.registeredTabsByWindow.get(windowId) || []), tabId])
    );

    this.broadcastSidePanelState(windowId);
  }

  private handleToggleSidePanel(windowId: WindowId) {
    const isOpen = this.windowStates.get(windowId) || false;

    if (isOpen) {
      const port = this.windowPorts.get(windowId);
      if (port) {
        port.postMessage(
          createExtensionMessage(MessageType.SP_CLOSE, undefined)
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
                '[SidePanelService] Error opening side panel:',
                error
              )
            );
        }
      });
    }
  }

  private broadcastSidePanelState(windowId: number) {
    const isOpen = this.windowStates.get(windowId) || false;

    chrome.tabs.query({ windowId }, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          const foundRegisteredTab = (
            this.registeredTabsByWindow.get(windowId) || new Set([])
          ).has(tab.id);

          if (foundRegisteredTab) {
            chrome.tabs
              .sendMessage(
                tab.id,
                createExtensionMessage(MessageType.SP_STATE_CHANGED, { isOpen })
              )
              .catch((err) => {
                console.error(
                  `[SidePanelService] Failed to broadcast to tab ${tab.id}:`,
                  err
                );
              });
          }
        }
      });
    });
  }
}
