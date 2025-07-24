import { Event, PayloadOf } from '@repo/shared/types/session';

type EffectiveTheme = 'light' | 'dark';

export class AppSettingsWorker {
  private effectiveTheme: EffectiveTheme = 'light';
  private events: Event[] = [];
  private ports: chrome.runtime.Port[] = [];

  private hasSessionStarted: boolean = false;

  constructor() {
    // Set up port connection listener
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'appSettings') {
        this.ports.push(port);

        // Send initial state
        this.sendUpdate(port);

        // Set up message handler
        port.onMessage.addListener((msg) => this.handleMessage(port, msg));

        // Handle disconnection
        port.onDisconnect.addListener(() => {
          this.ports = this.ports.filter((p) => p !== port);
        });
      }
    });

    // tab_open event emission
    chrome.tabs.onCreated.addListener(() => {
      if (!this.hasSessionStarted) return;

      this.addEvent({
        type: 'browser',
        action: 'tab_open',
        timestamp: Date.now(),
      });
    });

    // tab_close event emission
    chrome.tabs.onRemoved.addListener(() => {
      if (!this.hasSessionStarted) return;

      this.addEvent({
        type: 'browser',
        action: 'tab_close',
        timestamp: Date.now(),
      });
    });

    // website_visit event emission
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      if (!this.hasSessionStarted) return;
      if (tab.url && tab.url.startsWith('chrome://')) return;

      // Tab Update must be "{ status: "complete" }" to indicate successful tab navigation
      if (changeInfo.status !== 'complete') return;

      if (tab.url) {
        const lastFoundUrl = this.findLastUrlOfTab(tabId);

        // Ignore browser refreshes
        if (lastFoundUrl === tab.url) return;

        this.addEvent({
          type: 'browser',
          action: 'website_visit',
          timestamp: Date.now(),
          payload: {
            tabId,
            url: tab.url,
          },
        });
      }
    });
  }

  private sendUpdate(port?: chrome.runtime.Port) {
    const update = {
      type: 'update',
      effectiveTheme: this.effectiveTheme,
      events: this.events,
    };

    if (port) {
      port.postMessage(update);
    } else {
      this.ports.forEach((p) => p.postMessage(update));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleMessage(_port: chrome.runtime.Port, msg: any) {
    switch (msg.action) {
      case 'setTheme':
        this.setEffectiveTheme(msg.value);
        break;
      case 'addEvent':
        this.addEvent(msg.event);
        break;
      case 'clearEvents':
        this.clearEvents();
        break;
      case 'websiteVisit':
        this.navigateToSite(msg.payload);
    }
  }

  setEffectiveTheme(effectiveTheme: EffectiveTheme) {
    this.effectiveTheme = effectiveTheme;
    this.sendUpdate();
  }

  addEvent(event: Event) {
    if (event.type === 'stopwatch' && event.action === 'start') {
      this.hasSessionStarted = true;
    }

    this.events.push(event);
    this.sendUpdate();
  }

  clearEvents() {
    this.hasSessionStarted = false;

    this.events = [];
    this.sendUpdate();
  }

  navigateToSite(payload: PayloadOf<'browser', 'website_visit'>) {
    chrome.tabs.query({ url: payload.url }, (tabs) => {
      if (tabs.length > 0) {
        // Focus the existing tab
        // eslint-disable-next-line @typescript-eslint/no-non-null-asserted-optional-chain
        chrome.tabs.update(tabs[0]?.id!, { active: true });
      } else {
        // Create a new tab and log events
        chrome.tabs.create({ url: payload.url }, (tab) => {
          if (tab.id && tab.url) {
            // tab_open automatically generated, but
            // we need to generate the website_visit event here

            this.addEvent({
              type: 'browser',
              action: 'website_visit',
              timestamp: Date.now(),
              payload: {
                tabId: tab.id,
                url: tab.url,
              },
            });
          }
        });
      }
    });
  }

  findLastUrlOfTab(tabId: number) {
    const lastLogOfTabId = this.events
      .filter(
        (ev) =>
          ev.type === 'browser' &&
          ev.action === 'website_visit' &&
          'payload' in ev &&
          tabId === ev.payload.tabId
      )
      .at(-1);

    if (
      lastLogOfTabId &&
      'payload' in lastLogOfTabId &&
      typeof lastLogOfTabId.payload === 'object'
    ) {
      return lastLogOfTabId.payload.url;
    }
    return undefined;
  }
}
