export class SidePanelWorker {
  private isSidePanelOpen = false;

  constructor() {
    // Configure the side panel to open when the extension icon is clicked
    chrome.sidePanel
      .setPanelBehavior({ openPanelOnActionClick: true })
      .catch((error) => console.error(error));

    // Listen for connections from the side panel
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'model-metrics-side-panel') {
        this.isSidePanelOpen = true;
        this.broadcastSidePanelState(true);

        port.onDisconnect.addListener(() => {
          this.isSidePanelOpen = false;
          this.broadcastSidePanelState(false);
        });
      }
    });

    chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
      switch (message.type) {
        case 'TOGGLE_SIDE_PANEL':
          this.handleToggleSidePanel();
          break;
        case 'GET_SIDE_PANEL_STATE':
          sendResponse({ isOpen: this.isSidePanelOpen });
      }

      // Return true to indicate that the response will be sent asynchronously
      // This keeps the message channel open for sendResponse
      return true;
    });
  }

  private handleToggleSidePanel() {
    if (this.isSidePanelOpen) {
      chrome.runtime.sendMessage({ type: 'CLOSE_SIDE_PANEL' });
    } else {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]?.id) {
          chrome.sidePanel
            .open({ tabId: tabs[0].id })
            .catch((error) =>
              console.error('Error opening side panel:', error)
            );
        }
      });
    }
  }

  private broadcastSidePanelState(isOpen: boolean) {
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
