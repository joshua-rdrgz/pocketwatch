interface PanelState {
  isMinimized: boolean;
  position: PanelPosition;
}

interface PanelPosition {
  x: number;
  y: number;
}

export class BrowserPanelWorker {
  private tabStates: Map<number, PanelState> = new Map();
  private ports: chrome.runtime.Port[] = [];

  constructor() {
    // Set up port connection listener
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'browserPanel' && port.sender?.tab?.id !== undefined) {
        const tabId = port.sender.tab.id;
        this.ports.push(port);

        // Initialize state for this tab if it doesn't exist
        if (!this.tabStates.has(tabId)) {
          this.tabStates.set(tabId, {
            isMinimized: false,
            position: { x: 0, y: 0 },
          });
        }

        // Send initial state
        this.sendInitialState(port, tabId);

        // Set up message handler
        port.onMessage.addListener((msg) =>
          this.handleMessage(port, tabId, msg)
        );

        // Handle disconnection
        port.onDisconnect.addListener(() => {
          this.ports = this.ports.filter((p) => p !== port);
        });
      }
    });
  }

  private sendInitialState(port: chrome.runtime.Port, tabId: number) {
    const state = this.tabStates.get(tabId);
    if (state) {
      port.postMessage({
        type: 'update',
        isMinimized: state.isMinimized,
        position: state.position,
        initial: true,
      });
    }
  }

  private sendUpdate(port: chrome.runtime.Port, tabId: number) {
    const state = this.tabStates.get(tabId);
    if (state) {
      port.postMessage({
        type: 'update',
        isMinimized: state.isMinimized,
        position: state.position,
        initial: false,
      });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleMessage(port: chrome.runtime.Port, tabId: number, msg: any) {
    const state = this.tabStates.get(tabId);
    if (!state) return;

    switch (msg.action) {
      case 'setIsMinimized':
        state.isMinimized = msg.value;
        this.sendUpdate(port, tabId);
        break;
      case 'setPosition':
        state.position = msg.value;
        this.sendUpdate(port, tabId);
        break;
      case 'getIsMinimized':
        port.postMessage({
          type: 'isMinimized',
          value: state.isMinimized,
        });
        break;
      case 'getPosition':
        port.postMessage({
          type: 'position',
          value: state.position,
        });
        break;
    }
  }
}