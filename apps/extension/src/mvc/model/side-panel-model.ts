import { BaseModel } from './base';

type WindowId = number;
type TabId = number;

interface SidePanelState {
  // { [WindowId]: isOpen } => Indicates which windows have the side panel open
  windowStates: Map<WindowId, boolean>;
  // { [WindowId]: Port } => Maps established WindowIds with their respective ports
  windowPorts: Map<WindowId, chrome.runtime.Port>;
  // { [WindowId]: TabId[] } => Maps established WindowIds with all registered TabIds
  registeredTabsByWindow: Map<WindowId, Set<TabId>>;
}

const initialSidePanelState: SidePanelState = {
  windowStates: new Map(),
  windowPorts: new Map(),
  registeredTabsByWindow: new Map(),
};

export class SidePanelModel extends BaseModel<SidePanelState> {
  constructor() {
    super(initialSidePanelState);
  }

  registerWindowConnection(
    windowId: WindowId,
    tabId: TabId,
    port: chrome.runtime.Port
  ) {
    const currentState = this.getState();

    currentState.windowStates.set(windowId, true);
    currentState.windowPorts.set(windowId, port);
    currentState.registeredTabsByWindow.set(
      windowId,
      new Set([
        ...(currentState.registeredTabsByWindow.get(windowId) || []),
        tabId,
      ])
    );

    this.setState({
      windowStates: new Map(currentState.windowStates),
      windowPorts: new Map(currentState.windowPorts),
      registeredTabsByWindow: new Map(currentState.registeredTabsByWindow),
    });
  }

  setWindowState(windowId: WindowId, isOpen: boolean) {
    const currentState = this.getState();
    currentState.windowStates.set(windowId, isOpen);

    this.setState({
      windowStates: new Map(currentState.windowStates),
    });
  }

  removeWindowPort(windowId: WindowId) {
    const currentState = this.getState();
    currentState.windowStates.set(windowId, false);
    currentState.windowPorts.delete(windowId);

    this.setState({
      windowStates: new Map(currentState.windowStates),
      windowPorts: new Map(currentState.windowPorts),
    });
  }

  getWindowState(windowId: WindowId): boolean {
    return this.getState().windowStates.get(windowId) || false;
  }

  getWindowPort(windowId: WindowId): chrome.runtime.Port | undefined {
    return this.getState().windowPorts.get(windowId);
  }

  getRegisteredTabs(windowId: WindowId): Set<TabId> {
    return this.getState().registeredTabsByWindow.get(windowId) || new Set();
  }

  findWindowIdByPort(port: chrome.runtime.Port): WindowId | undefined {
    const currentState = this.getState();
    for (const [windowId, windowPort] of currentState.windowPorts.entries()) {
      if (windowPort === port) {
        return windowId;
      }
    }
    return undefined;
  }
}
