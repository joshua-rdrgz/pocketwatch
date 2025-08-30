/* eslint-disable @typescript-eslint/no-explicit-any */
import { createExtensionMessage } from '@repo/shared/lib/connection';
import {
  createSessionAssignTask,
  createSessionCancel,
  createSessionComplete,
  createSessionEvent,
  createSessionInit,
  createSessionUnassignTask,
  createTabCloseEvent,
  createTabOpenEvent,
  createWebsiteVisitEvent,
} from '@repo/shared/lib/session-ws';
import {
  ExtensionMessageType,
  TypedExtensionMessage,
} from '@repo/shared/types/extension-connection';
import {
  Event,
  PayloadOf,
  SessionMessage,
  SessionUpdatePayload,
} from '@repo/shared/types/session';
import { WsMessageType } from '@repo/shared/types/websocket';
import { SessionModel } from '../model/session-model';
import { WebSocketService } from '../service/websocket-service';
import { BasePortController } from './base-port';

type SessionPortMessage =
  | TypedExtensionMessage<ExtensionMessageType.SESSION_INIT, undefined>
  | TypedExtensionMessage<ExtensionMessageType.SESSION_ASSIGN_TASK, string>
  | TypedExtensionMessage<ExtensionMessageType.SESSION_UNASSIGN_TASK, undefined>
  | TypedExtensionMessage<ExtensionMessageType.SESSION_COMPLETE, undefined>
  | TypedExtensionMessage<ExtensionMessageType.SESSION_CANCEL, undefined>
  | TypedExtensionMessage<
      ExtensionMessageType.SESSION_EVENT,
      Event<'stopwatch' | 'browser'>
    >
  | TypedExtensionMessage<
      ExtensionMessageType.SESSION_URL_CLICK,
      PayloadOf<'browser', 'website_visit'>
    >;

interface SessionControllerOptions {
  getOneTimeToken: () => Promise<string | null>;
}

export class SessionController extends BasePortController {
  private sessionModel: SessionModel;
  private webSocketService: WebSocketService;

  constructor(options: SessionControllerOptions) {
    super();

    this.sessionModel = this.registerModel('session', new SessionModel());

    // Initialize WebSocket service
    this.webSocketService = new WebSocketService({
      getToken: () => options.getOneTimeToken(),
      onConnect: () => this.sessionModel.setWsConnectionStatus('connected'),
      onDisconnect: () =>
        this.sessionModel.setWsConnectionStatus('not_connected'),
      onRetryStateChange: (wsRetryState) =>
        this.sessionModel.setWsRetryState(wsRetryState),
    });

    // Set up WebSocket message handlers
    this.setupWebSocketHandlers();

    // Set up browser event listeners
    this.setupTabListeners();
  }

  protected handleViewMessage(
    msg: SessionPortMessage,
    port: chrome.runtime.Port
  ): void {
    let result: { success: boolean; error?: string };

    switch (msg.type) {
      case ExtensionMessageType.SESSION_INIT:
        result = this.webSocketService.send(createSessionInit());
        if (!result.success) this.sendErrorToPort(port, result.error!);
        break;
      case ExtensionMessageType.SESSION_ASSIGN_TASK:
        result = this.webSocketService.send(
          createSessionAssignTask(msg.payload)
        );
        if (!result.success) this.sendErrorToPort(port, result.error!);
        break;
      case ExtensionMessageType.SESSION_UNASSIGN_TASK:
        result = this.webSocketService.send(createSessionUnassignTask());
        if (!result.success) this.sendErrorToPort(port, result.error!);
        break;
      case ExtensionMessageType.SESSION_COMPLETE:
        result = this.webSocketService.send(createSessionComplete());
        if (!result.success) this.sendErrorToPort(port, result.error!);
        break;
      case ExtensionMessageType.SESSION_CANCEL:
        result = this.webSocketService.send(createSessionCancel());
        if (!result.success) this.sendErrorToPort(port, result.error!);
        break;
      case ExtensionMessageType.SESSION_EVENT:
        result = this.webSocketService.send(createSessionEvent(msg.payload));
        if (!result.success) this.sendErrorToPort(port, result.error!);
        break;
      case ExtensionMessageType.SESSION_URL_CLICK:
        this.navigateToSite(msg.payload);
        break;
    }
  }

  protected sendInitialState(port: chrome.runtime.Port): void {
    const state = this.sessionModel.getState();
    const updatedSessionState: SessionUpdatePayload = {
      events: state.events,
      timers: state.timers,
      stopwatchMode: state.stopwatchMode,
      assignedTaskId: state.assignedTaskId,
      sessionLifeCycle: state.sessionLifeCycle,
      wsConnectionStatus: state.wsConnectionStatus,
      wsRetryState: state.wsRetryState,
    };

    const message = createExtensionMessage(
      ExtensionMessageType.SESSION_SYNC,
      updatedSessionState
    );

    port.postMessage(message);
  }

  protected onModelChange(_modelName: string, state: any): void {
    // Automatically broadcast session state changes to all connected views
    const updatedSessionState: SessionUpdatePayload = {
      events: state.events,
      timers: state.timers,
      stopwatchMode: state.stopwatchMode,
      assignedTaskId: state.assignedTaskId,
      sessionLifeCycle: state.sessionLifeCycle,
      wsConnectionStatus: state.wsConnectionStatus,
      wsRetryState: state.wsRetryState,
    };

    const message = createExtensionMessage(
      ExtensionMessageType.SESSION_SYNC,
      updatedSessionState
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
      type: ExtensionMessageType.SESSION_SYNC,
      error,
      timestamp: Date.now(),
    };
    port.postMessage(message);
  }

  /**
   * Sets up WebSocket handlers to sync client state with server messages.
   */
  private setupWebSocketHandlers() {
    this.webSocketService.onMessage<SessionMessage>(
      WsMessageType.CONNECTION_READY,
      (msg) => {
        const connectionMsg = msg as Extract<
          SessionMessage,
          { type: WsMessageType.CONNECTION_READY }
        >;

        console.log('[SessionController] WebSocket connection ready: ', msg);
        this.sessionModel._initStateFromServer(connectionMsg.session);
      }
    );

    this.webSocketService.onMessage<SessionMessage>(
      WsMessageType.SESSION_INIT_ACK,
      (msg) => {
        console.log('[SessionController] Session initialized:', msg);
        this.sessionModel.setSessionLifeCycle('initialized_no_task');
      }
    );

    this.webSocketService.onMessage<SessionMessage>(
      WsMessageType.SESSION_TASK_ASSIGNED,
      (msg) => {
        console.log('[SessionController] Task assigned:', msg);
        if ('taskId' in msg && typeof msg.taskId === 'string') {
          this.sessionModel.setAssignedTaskId(msg.taskId);
          this.sessionModel.setSessionLifeCycle('initialized_with_task');
        }
      }
    );

    this.webSocketService.onMessage<SessionMessage>(
      WsMessageType.SESSION_TASK_UNASSIGNED,
      (msg) => {
        console.log('[SessionController] Task unassigned:', msg);
        this.sessionModel.setAssignedTaskId(null);
        this.sessionModel.setSessionLifeCycle('initialized_no_task');
      }
    );

    this.webSocketService.onMessage<SessionMessage>(
      WsMessageType.EVENT_BROADCAST,
      (msg) => {
        console.log('[SessionController] Event broadcast received:', msg);
        if ('event' in msg && msg.event) {
          const event = msg.event as Event<'stopwatch' | 'browser'>;

          // Handle session lifecycle changes based on events
          if (event.type === 'stopwatch') {
            switch (event.action) {
              case 'start':
                this.sessionModel.setSessionLifeCycle('active');
                this.sessionModel.startTimer();
                break;
              case 'break':
                this.sessionModel.setTimerMode('break');
                break;
              case 'resume':
                this.sessionModel.setTimerMode('work');
                break;
              case 'finish':
                this.sessionModel.setSessionLifeCycle('completed');
                this.sessionModel.stopTimer();
                break;
            }
          }

          this.sessionModel.addEvent(event);
        }
      }
    );

    this.webSocketService.onMessage<SessionMessage>(
      WsMessageType.SESSION_COMPLETE_ACK,
      (msg) => {
        console.log('[SessionController] Session completed:', msg);
        this.sessionModel.setSessionLifeCycle('idle');
        this.sessionModel.resetTimer();
      }
    );

    this.webSocketService.onMessage<SessionMessage>(
      WsMessageType.SESSION_CANCEL_ACK,
      (msg) => {
        console.log('[SessionController] Session cancelled:', msg);
        this.sessionModel.setSessionLifeCycle('idle');
        this.sessionModel.resetTimer();
      }
    );

    this.webSocketService.onMessage<SessionMessage>(
      WsMessageType.SESSION_ERROR,
      (msg) => {
        console.error('[SessionController] Session error:', msg);
      }
    );
  }

  private setupTabListeners() {
    // tab_open event emission
    chrome.tabs.onCreated.addListener(() => {
      const state = this.sessionModel.getState();
      if (state.sessionLifeCycle !== 'active') return;

      const result = this.webSocketService.send(
        createSessionEvent(createTabOpenEvent())
      );

      if (!result.success) {
        console.error(
          '[SessionController] Failed to send tab_open event:',
          result.error
        );
      }
    });

    // tab_close event emission
    chrome.tabs.onRemoved.addListener(() => {
      const state = this.sessionModel.getState();
      if (state.sessionLifeCycle !== 'active') return;

      const result = this.webSocketService.send(
        createSessionEvent(createTabCloseEvent())
      );

      if (!result.success) {
        console.error(
          '[SessionController] Failed to send tab_close event:',
          result.error
        );
      }
    });

    // website_visit event emission
    chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
      const state = this.sessionModel.getState();
      if (state.sessionLifeCycle !== 'active') return;
      if (tab.url && tab.url.startsWith('chrome://')) return;

      // Tab Update must be "{ status: "complete" }" to indicate successful tab navigation
      if (changeInfo.status !== 'complete') return;

      if (tab.url) {
        const lastFoundUrl = this.sessionModel.findLastUrlOfTab(tabId);

        // Ignore browser refreshes
        if (lastFoundUrl === tab.url) return;

        const result = this.webSocketService.send(
          createSessionEvent(createWebsiteVisitEvent(tabId, tab.url))
        );

        if (!result.success) {
          console.error(
            '[SessionController] Failed to send website_visit event:',
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
              createSessionEvent(createWebsiteVisitEvent(tab.id, tab.url))
            );

            if (!result.success) {
              console.error(
                '[SessionController] Failed to send navigate website_visit event:',
                result.error
              );
            }
          }
        });
      }
    });
  }
}
