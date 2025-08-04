import { createMessage } from '@repo/shared/lib/connection';
import { MessageType, TypedMessage } from '@repo/shared/types/connection';

type TabId = number;

interface PanelState {
  isMinimized: boolean;
  position: PanelPosition;
}

interface PanelPosition {
  x: number;
  y: number;
}

type BrowserPanelMessage =
  | TypedMessage<MessageType.BP_SET_MINIMIZED, boolean>
  | TypedMessage<MessageType.BP_SET_POSITION, PanelPosition>
  | TypedMessage<MessageType.BP_GET_MINIMIZED, undefined>
  | TypedMessage<MessageType.BP_GET_POSITION, undefined>;

export class BrowserPanelService {
  private tabStates: Map<TabId, PanelState> = new Map();

  registerPort(port: chrome.runtime.Port) {
    if (port.sender?.tab?.id !== undefined) {
      const tabId = port.sender.tab.id;

      // Initialize state for this tab if it doesn't exist
      if (!this.tabStates.has(tabId)) {
        this.tabStates.set(tabId, {
          isMinimized: false,
          position: { x: 0, y: 0 },
        });
      }

      // Send initial state
      const initialState = this.tabStates.get(tabId);
      if (initialState) {
        port.postMessage(
          createMessage(MessageType.BP_UPDATE, {
            isMinimized: initialState.isMinimized,
            position: initialState.position,
            initial: true,
          })
        );
      }

      // Set up message handler
      port.onMessage.addListener((msg) => this.handleMessage(port, tabId, msg));
    }
  }

  private handleMessage(
    port: chrome.runtime.Port,
    tabId: TabId,
    msg: BrowserPanelMessage
  ) {
    const state = this.tabStates.get(tabId);
    if (!state) return;

    switch (msg.type) {
      case MessageType.BP_SET_MINIMIZED:
        state.isMinimized = msg.payload;
        this.sendUpdate(port, tabId);
        break;
      case MessageType.BP_SET_POSITION:
        state.position = msg.payload;
        this.sendUpdate(port, tabId);
        break;
      case MessageType.BP_GET_MINIMIZED:
        port.postMessage(
          createMessage(MessageType.BP_SET_MINIMIZED, state.isMinimized)
        );
        break;
      case MessageType.BP_GET_POSITION:
        port.postMessage(
          createMessage(MessageType.BP_SET_POSITION, state.position)
        );
        break;
    }
  }

  private sendUpdate(port: chrome.runtime.Port, tabId: TabId) {
    const state = this.tabStates.get(tabId);

    if (state) {
      port.postMessage(
        createMessage(MessageType.BP_UPDATE, {
          isMinimized: state.isMinimized,
          position: state.position,
          initial: false,
        })
      );
    }
  }
}
