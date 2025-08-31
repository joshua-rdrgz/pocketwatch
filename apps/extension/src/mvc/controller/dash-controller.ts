/* eslint-disable @typescript-eslint/no-explicit-any */
import { createExtensionMessage } from '@repo/shared/lib/connection';
import {
  createDashCancel,
  createDashComplete,
  createDashEvent,
  createDashInit,
  createTabCloseEvent,
  createTabOpenEvent,
  createWebsiteVisitEvent,
} from '@repo/shared/lib/dash-ws';
import {
  ExtensionMessageType,
  TypedExtensionMessage,
} from '@repo/shared/types/extension-connection';
import {
  Event,
  PayloadOf,
  DashMessage,
  DashUpdatePayload,
} from '@repo/shared/types/dash';
import { WsMessageType } from '@repo/shared/types/websocket';
import { DashModel } from '../model/dash-model';
import { WebSocketService } from '../service/websocket-service';
import { BasePortController } from './base-port';

type DashPortMessage =
  | TypedExtensionMessage<ExtensionMessageType.DASH_INIT, undefined>
  | TypedExtensionMessage<ExtensionMessageType.DASH_COMPLETE, undefined>
  | TypedExtensionMessage<ExtensionMessageType.DASH_CANCEL, undefined>
  | TypedExtensionMessage<
      ExtensionMessageType.DASH_EVENT,
      Event<'stopwatch' | 'browser'>
    >
  | TypedExtensionMessage<
      ExtensionMessageType.DASH_URL_CLICK,
      PayloadOf<'browser', 'website_visit'>
    >;

interface DashControllerOptions {
  getOneTimeToken: () => Promise<string | null>;
}

export class DashController extends BasePortController {
  private dashModel: DashModel;
  private webSocketService: WebSocketService;

  constructor(options: DashControllerOptions) {
    super();

    this.dashModel = this.registerModel('dash', new DashModel());

    // Initialize WebSocket service
    this.webSocketService = new WebSocketService({
      getToken: () => options.getOneTimeToken(),
      onConnect: () => this.dashModel.setWsConnectionStatus('connected'),
      onDisconnect: () => this.dashModel.setWsConnectionStatus('not_connected'),
      onRetryStateChange: (wsRetryState) =>
        this.dashModel.setWsRetryState(wsRetryState),
    });

    // Set up WebSocket message handlers
    this.setupWebSocketHandlers();

    // Set up browser event listeners
    this.setupTabListeners();
  }

  protected handleViewMessage(
    msg: DashPortMessage,
    port: chrome.runtime.Port
  ): void {
    let result: { success: boolean; error?: string };

    switch (msg.type) {
      case ExtensionMessageType.DASH_INIT:
        result = this.webSocketService.send(createDashInit());
        if (!result.success) this.sendErrorToPort(port, result.error!);
        break;
      case ExtensionMessageType.DASH_COMPLETE:
        result = this.webSocketService.send(createDashComplete());
        if (!result.success) this.sendErrorToPort(port, result.error!);
        break;
      case ExtensionMessageType.DASH_CANCEL:
        result = this.webSocketService.send(createDashCancel());
        if (!result.success) this.sendErrorToPort(port, result.error!);
        break;
      case ExtensionMessageType.DASH_EVENT:
        result = this.webSocketService.send(createDashEvent(msg.payload));
        if (!result.success) this.sendErrorToPort(port, result.error!);
        break;
      case ExtensionMessageType.DASH_URL_CLICK:
        this.navigateToSite(msg.payload);
        break;
    }
  }

  protected sendInitialState(port: chrome.runtime.Port): void {
    const state = this.dashModel.getState();
    const updatedDashState: DashUpdatePayload = {
      events: state.events,
      timers: state.timers,
      stopwatchMode: state.stopwatchMode,
      dashLifeCycle: state.dashLifeCycle,
      wsConnectionStatus: state.wsConnectionStatus,
      wsRetryState: state.wsRetryState,
    };

    const message = createExtensionMessage(
      ExtensionMessageType.DASH_SYNC,
      updatedDashState
    );

    port.postMessage(message);
  }

  protected onModelChange(_modelName: string, state: any): void {
    // Automatically broadcast dash state changes to all connected views
    const updatedDashState: DashUpdatePayload = {
      events: state.events,
      timers: state.timers,
      stopwatchMode: state.stopwatchMode,
      dashLifeCycle: state.dashLifeCycle,
      wsConnectionStatus: state.wsConnectionStatus,
      wsRetryState: state.wsRetryState,
    };

    const message = createExtensionMessage(
      ExtensionMessageType.DASH_SYNC,
      updatedDashState
    );

    this.broadcastToViews(message);
  }

  // WebSocket Connection Management
  async connectWebSocket() {
    await this.webSocketService.connect();
  }

  disconnectWebSocket() {
    this.webSocketService.disconnect();
  }

  private sendErrorToPort(port: chrome.runtime.Port, error: string) {
    const message = {
      type: ExtensionMessageType.DASH_SYNC,
      error,
      timestamp: Date.now(),
    };
    port.postMessage(message);
  }

  /**
   * Sets up WebSocket handlers to sync client state with server messages.
   */
  private setupWebSocketHandlers() {
    this.webSocketService.onMessage<DashMessage>(
      WsMessageType.CONNECTION_READY,
      (msg) => {
        const connectionMsg = msg as Extract<
          DashMessage,
          { type: WsMessageType.CONNECTION_READY }
        >;

        console.log('[DashController] WebSocket connection ready: ', msg);
        this.dashModel._initStateFromServer(connectionMsg.dash);
      }
    );

    this.webSocketService.onMessage<DashMessage>(
      WsMessageType.DASH_INIT_ACK,
      (msg) => {
        console.log('[DashController] Dash initialized:', msg);
        this.dashModel.setDashLifeCycle('initialized');
      }
    );

    this.webSocketService.onMessage<DashMessage>(
      WsMessageType.EVENT_BROADCAST,
      (msg) => {
        console.log('[DashController] Event broadcast received:', msg);
        if ('event' in msg && msg.event) {
          const event = msg.event as Event<'stopwatch' | 'browser'>;

          // Handle dash lifecycle changes based on events
          if (event.type === 'stopwatch') {
            switch (event.action) {
              case 'start':
                this.dashModel.setDashLifeCycle('active');
                this.dashModel.startTimer();
                break;
              case 'break':
                this.dashModel.setTimerMode('break');
                break;
              case 'resume':
                this.dashModel.setTimerMode('work');
                break;
              case 'finish':
                this.dashModel.setDashLifeCycle('completed');
                this.dashModel.stopTimer();
                break;
            }
          }

          this.dashModel.addEvent(event);
        }
      }
    );

    this.webSocketService.onMessage<DashMessage>(
      WsMessageType.DASH_COMPLETE_ACK,
      (msg) => {
        console.log('[DashController] Dash completed:', msg);
        this.dashModel.setDashLifeCycle('idle');
        this.dashModel.resetTimer();
      }
    );

    this.webSocketService.onMessage<DashMessage>(
      WsMessageType.DASH_CANCEL_ACK,
      (msg) => {
        console.log('[DashController] Dash cancelled:', msg);
        this.dashModel.setDashLifeCycle('idle');
        this.dashModel.resetTimer();
      }
    );

    this.webSocketService.onMessage<DashMessage>(
      WsMessageType.DASH_ERROR,
      (msg) => {
        console.error('[DashController] Dash error:', msg);
      }
    );
  }

  private setupTabListeners() {
    // tab_open event emission
    chrome.tabs.onCreated.addListener(() => {
      const state = this.dashModel.getState();
      if (state.dashLifeCycle !== 'active') return;

      const result = this.webSocketService.send(
        createDashEvent(createTabOpenEvent())
      );

      if (!result.success) {
        console.error(
          '[DashController] Failed to send tab_open event:',
          result.error
        );
      }
    });

    // tab_close event emission
    chrome.tabs.onRemoved.addListener(() => {
      const state = this.dashModel.getState();
      if (state.dashLifeCycle !== 'active') return;

      const result = this.webSocketService.send(
        createDashEvent(createTabCloseEvent())
      );

      if (!result.success) {
        console.error(
          '[DashController] Failed to send tab_close event:',
          result.error
        );
      }
    });

    // website_visit event emission
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      const state = this.dashModel.getState();
      if (state.dashLifeCycle !== 'active') return;
      if (tab.url && tab.url.startsWith('chrome://')) return;

      // Tab Update must be "{ status: "complete" }" to indicate successful tab navigation
      if (changeInfo.status !== 'complete') return;

      if (tab.url) {
        const lastFoundUrl = this.dashModel.findLastUrlOfTab(tabId);

        // Ignore browser refreshes
        if (lastFoundUrl === tab.url) return;

        const result = this.webSocketService.send(
          createDashEvent(createWebsiteVisitEvent(tabId, tab.url))
        );

        if (!result.success) {
          console.error(
            '[DashController] Failed to send website_visit event:',
            result.error
          );
        }
      }
    });
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
            const result = this.webSocketService.send(
              createDashEvent(createWebsiteVisitEvent(tab.id, tab.url))
            );

            if (!result.success) {
              console.error(
                '[DashController] Failed to send navigate website_visit event:',
                result.error
              );
            }
          }
        });
      }
    });
  }
}
