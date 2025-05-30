type WindowId = number;
type TabId = number;

export class SidePanelWorker {
  // { [WindowId]: isOpen } => Indicates which windows have the side panel open
  private windowStates: Map<WindowId, boolean> = new Map();

  // { [WindowId]: Port } => Maps established TabIds with their respective ports
  private windowPorts: Map<WindowId, chrome.runtime.Port> = new Map();

  // { [WindowId]: TabId[] } => Maps established WindowIds with all registered TabIds
  private registeredTabsByWindow: Map<WindowId, Set<TabId>> = new Map();

  constructor() {
    this.registerIconBehavior();
    this.registerSidePanelListeners();
    this.registerBrowserPanelListeners();
  }

  private registerIconBehavior() {
    // Configure the side panel to open when the extension icon is clicked
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) =>
        console.error('[Service Worker] Error configuring side panel:', error)
      );
  }

  private registerSidePanelListeners() {
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'sidePanel') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        port.onMessage.addListener((msg: any) => {
          if (
            msg.type === 'REGISTER_WINDOW' &&
            typeof msg.windowId === 'number'
          ) {
            this.registerWindowConnection(msg.windowId, msg.tabId, port);
          }
        });
      }
    });
  }

  private registerBrowserPanelListeners() {
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      const windowId = sender.tab?.windowId;
      const tabId = sender.tab?.id;

      if (
        message.type === 'TOGGLE_SIDE_PANEL' ||
        message.type === 'GET_SIDE_PANEL_STATE'
      ) {
        if (tabId && typeof windowId === 'number') {
          switch (message.type) {
            case 'TOGGLE_SIDE_PANEL':
              this.handleToggleSidePanel(windowId);
              sendResponse({ success: true });
              break;
            case 'GET_SIDE_PANEL_STATE': {
              const isOpen = this.windowStates.get(windowId) || false;
              sendResponse({ isOpen });
              break;
            }
          }
        } else {
          sendResponse({
            error: `Invalid Window ID: ${windowId}, or Invalid Tab ID: ${tabId}`,
          });
        }
      }

      // Return true to indicate that the response will be sent asynchronously
      // This is required for chrome.runtime.onMessage listeners that use sendResponse
      return true;
    });
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

    port.onDisconnect.addListener(() => {
      this.windowStates.set(windowId, false);
      this.windowPorts.delete(windowId);

      this.broadcastSidePanelState(windowId);
    });
  }

  private handleToggleSidePanel(windowId: WindowId) {
    const isOpen = this.windowStates.get(windowId) || false;

    if (isOpen) {
      const port = this.windowPorts.get(windowId);
      if (port) {
        port.postMessage({ type: 'CLOSE_SIDE_PANEL' });
      }
    } else {
      chrome.tabs.query({ active: true, windowId }, (tabs) => {
        const tab = tabs[0];
        if (tab?.id) {
          chrome.sidePanel
            .open({ tabId: tab.id })
            .catch((error) =>
              console.error('[Service Worker] Error opening side panel:', error)
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
              .sendMessage(tab.id, {
                type: 'SIDE_PANEL_STATE_CHANGED',
                isOpen,
              })
              .catch((err) => {
                console.error(
                  `[Service Worker] Failed to broadcast to tab ${tab.id}:`,
                  err
                );
              });
          }
        }
      });
    });
  }
}
