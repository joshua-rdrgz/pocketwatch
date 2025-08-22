import { createExtensionMessage } from '@repo/shared/lib/connection';
import {
  ExtensionMessage,
  ExtensionMessageType,
  TypedExtensionMessage,
} from '@repo/shared/types/extension-connection';
import {
  Event,
  PayloadOf,
  SessionUpdatePayload,
  StopwatchMode,
} from '@repo/shared/types/session';
import { Stopwatch } from '../stopwatch';

type SessionMessage =
  | TypedExtensionMessage<ExtensionMessageType.SESSION_ADD_EVENT, Event>
  | TypedExtensionMessage<ExtensionMessageType.SESSION_CLEAR_EVENTS, undefined>
  | TypedExtensionMessage<
      ExtensionMessageType.SESSION_WEBSITE_VISIT,
      PayloadOf<'browser', 'website_visit'>
    >
  | TypedExtensionMessage<ExtensionMessageType.SESSION_START_TIMER, undefined>
  | TypedExtensionMessage<ExtensionMessageType.SESSION_STOP_TIMER, undefined>
  | TypedExtensionMessage<ExtensionMessageType.SESSION_RESET_TIMER, undefined>
  | TypedExtensionMessage<
      ExtensionMessageType.SESSION_SET_TIMER_MODE,
      StopwatchMode
    >;

interface ServiceOptions {
  onUpdate: (message: ExtensionMessage) => void;
}

export class SessionService {
  private events: Event[] = [];
  private hasSessionStarted: boolean = false;
  private stopwatch: Stopwatch;
  private onUpdate: (message: ExtensionMessage) => void;

  constructor(options: ServiceOptions) {
    this.onUpdate = options.onUpdate;
    this.stopwatch = new Stopwatch({
      onUpdate: () => this.sendUpdate(),
    });

    this.setupTabListeners();
  }

  registerPort(port: chrome.runtime.Port) {
    // Send initial state
    this.sendUpdate(port);

    // Set up message handler
    port.onMessage.addListener((msg) => this.handleMessage(port, msg));
  }

  private setupTabListeners() {
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

  private handleMessage(_port: chrome.runtime.Port, msg: SessionMessage) {
    switch (msg.type) {
      case ExtensionMessageType.SESSION_ADD_EVENT:
        this.addEvent(msg.payload);
        break;
      case ExtensionMessageType.SESSION_CLEAR_EVENTS:
        this.clearEvents();
        break;
      case ExtensionMessageType.SESSION_WEBSITE_VISIT:
        this.navigateToSite(msg.payload);
        break;
      case ExtensionMessageType.SESSION_START_TIMER:
        this.startTimer();
        break;
      case ExtensionMessageType.SESSION_STOP_TIMER:
        this.stopTimer();
        break;
      case ExtensionMessageType.SESSION_RESET_TIMER:
        this.resetTimer();
        break;
      case ExtensionMessageType.SESSION_SET_TIMER_MODE:
        this.setTimerMode(msg.payload);
        break;
    }
  }

  private addEvent(event: Event) {
    if (event.type === 'stopwatch' && event.action === 'start') {
      this.hasSessionStarted = true;
    }

    this.events.push(event);
    this.sendUpdate();
  }

  private clearEvents() {
    this.hasSessionStarted = false;
    this.events = [];
    this.sendUpdate();
  }

  private navigateToSite(payload: PayloadOf<'browser', 'website_visit'>) {
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

  private findLastUrlOfTab(tabId: number) {
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

  private startTimer() {
    this.hasSessionStarted = true;
    this.stopwatch.startTimer();
    this.sendUpdate();
  }

  private stopTimer() {
    this.hasSessionStarted = false;
    this.stopwatch.stopTimer();
    this.sendUpdate();
  }

  private resetTimer() {
    this.stopwatch.resetTimer();
    this.sendUpdate();
  }

  private setTimerMode(mode: StopwatchMode) {
    this.stopwatch.setTimerMode(mode);
    this.sendUpdate();
  }

  private sendUpdate(port?: chrome.runtime.Port) {
    const updatedSessionState: SessionUpdatePayload = {
      events: this.events,
      hasSessionStarted: this.hasSessionStarted,
      stopwatch: {
        timers: this.stopwatch.getTimers(),
        mode: this.stopwatch.getMode(),
      },
    };

    const message = createExtensionMessage(
      ExtensionMessageType.SESSION_UPDATE,
      updatedSessionState
    );

    if (port) {
      port.postMessage(message);
    } else {
      this.onUpdate(message);
    }
  }
}
