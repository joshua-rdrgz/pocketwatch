export class SidePanelWorker {
  // { [windowId]: isOpen }
  private windowStates: Map<number, boolean> = new Map();

  // { [windowId]: Port }
  private windowPorts: Map<number, chrome.runtime.Port> = new Map();

  constructor() {
    // Configure the side panel to open when the extension icon is clicked
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) =>
        console.error('[Service Worker] Error configuring side panel:', error)
      );

    // Listen for connections from the side panel
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'sidePanel') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        port.onMessage.addListener((msg: any) => {
          if (
            msg.type === 'REGISTER_WINDOW' &&
            typeof msg.windowId === 'number'
          ) {
            this.registerWindowConnection(msg.windowId, port);
          }
        });
      }
    });

    // Listen for messages from the browser panel (content script)
    chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
      const windowId = sender.tab?.windowId;

      if (typeof windowId === 'number') {
        switch (message.type) {
          case 'TOGGLE_SIDE_PANEL':
            this.handleToggleSidePanel(windowId);
            break;
          case 'GET_SIDE_PANEL_STATE': {
            const isOpen = this.windowStates.get(windowId) || false;
            sendResponse({ isOpen });
            break;
          }
        }
      }

      return true;
    });
  }

  private registerWindowConnection(
    windowId: number,
    port: chrome.runtime.Port
  ) {
    this.windowStates.set(windowId, true);
    this.windowPorts.set(windowId, port);

    port.onDisconnect.addListener(() => {
      this.windowStates.set(windowId, false);
      this.windowPorts.delete(windowId);
      this.broadcastSidePanelState(windowId);
    });

    this.broadcastSidePanelState(windowId);
  }

  private handleToggleSidePanel(windowId: number) {
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
      });
    });
  }
}
