import { BaseModel } from './base';

type TabId = number;

interface PanelState {
  isMinimized: boolean;
  position: PanelPosition;
}

interface PanelPosition {
  x: number;
  y: number;
}

interface BrowserPanelState {
  // { [TabId]: PanelState } => Maps TabIds with their panel state
  tabStates: Map<TabId, PanelState>;
}

const initialBrowserPanelState: BrowserPanelState = {
  tabStates: new Map(),
};

export class BrowserPanelModel extends BaseModel<BrowserPanelState> {
  constructor() {
    super(initialBrowserPanelState);
  }

  initializeTabState(tabId: TabId) {
    const currentState = this.getState();
    if (!currentState.tabStates.has(tabId)) {
      currentState.tabStates.set(tabId, {
        isMinimized: false,
        position: { x: 0, y: 0 },
      });

      this.setState({
        tabStates: new Map(currentState.tabStates),
      });
    }
  }

  setMinimized(tabId: TabId, isMinimized: boolean) {
    const currentState = this.getState();
    const tabState = currentState.tabStates.get(tabId);

    if (tabState) {
      tabState.isMinimized = isMinimized;
      this.setState({
        tabStates: new Map(currentState.tabStates),
      });
    }
  }

  setPosition(tabId: TabId, position: PanelPosition) {
    const currentState = this.getState();
    const tabState = currentState.tabStates.get(tabId);

    if (tabState) {
      tabState.position = position;
      this.setState({
        tabStates: new Map(currentState.tabStates),
      });
    }
  }

  getTabState(tabId: TabId): PanelState | undefined {
    return this.getState().tabStates.get(tabId);
  }

  getMinimized(tabId: TabId): boolean {
    const tabState = this.getTabState(tabId);
    return tabState?.isMinimized || false;
  }

  getPosition(tabId: TabId): PanelPosition {
    const tabState = this.getTabState(tabId);
    return tabState?.position || { x: 0, y: 0 };
  }
}

export type { PanelState, PanelPosition };
