export class SidePanelWorker {
  private isSidePanelOpen = false;

  constructor() {
    console.log('[Service Worker] Initializing side panel worker');

    // Configure the side panel to open when the extension icon is clicked
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .then(() =>
        console.log('[Service Worker] Side panel behavior configured')
      )
      .catch((error) =>
        console.error('[Service Worker] Error configuring side panel:', error)
      );

    // Listen for connections from the side panel
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'model-metrics-side-panel') {
        console.log('[Service Worker] Side panel connected');
        this.isSidePanelOpen = true;
        this.broadcastSidePanelState(true);

        port.onDisconnect.addListener(() => {
          console.log('[Service Worker] Side panel disconnected');
          this.isSidePanelOpen = false;
          this.broadcastSidePanelState(false);
        });
      }
    });

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      console.log('[Service Worker] Received message:', message);

      switch (message.type) {
        case 'TOGGLE_SIDE_PANEL':
          console.log('[Service Worker] Handling toggle side panel request');
          this.handleToggleSidePanel();
          break;
        case 'GET_SIDE_PANEL_STATE':
          console.log('[Service Worker] Sending side panel state:', {
            isOpen: this.isSidePanelOpen,
          });
          sendResponse({ isOpen: this.isSidePanelOpen });
      }

      return true;
    });
  }

  private handleToggleSidePanel() {
    if (this.isSidePanelOpen) {
      console.log('[Service Worker] Closing side panel');
      chrome.runtime.sendMessage({ type: 'CLOSE_SIDE_PANEL' });
    } else {
      console.log('[Service Worker] Opening side panel');
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.sidePanel
            .open({ tabId: tabs[0].id })
            .then(() =>
              console.log('[Service Worker] Side panel opened successfully')
            )
            .catch((error) =>
              console.error('[Service Worker] Error opening side panel:', error)
            );
        }
      });
    }
  }

  private broadcastSidePanelState(isOpen: boolean) {
    console.log('[Service Worker] Broadcasting side panel state:', { isOpen });
    chrome.tabs.query({}, (tabs) => {
      tabs.forEach((tab) => {
        if (tab.id) {
          chrome.tabs.sendMessage(tab.id, {
            type: 'SIDE_PANEL_STATE_CHANGED',
            isOpen,
          });
        }
      });
    });
  }
}
