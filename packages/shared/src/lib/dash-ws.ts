import { WsMessageType } from '../types/websocket';
import { type DashMessage } from '../types/dash';
import { type Event } from '../types/dash';

// Generic type for message creator functions
export type MessageCreator<T extends readonly unknown[] = []> = (
  ...args: T
) => DashMessage;

// Client -> Server message creators (no dashId)
export function createDashInit(): DashMessage {
  return {
    type: WsMessageType.DASH_INIT,
  } as DashMessage;
}

export function createDashEvent(
  event: Event<'stopwatch' | 'browser'>
): DashMessage {
  return {
    type: WsMessageType.DASH_EVENT,
    event,
  } as DashMessage;
}

export function createDashComplete(): DashMessage {
  return {
    type: WsMessageType.DASH_COMPLETE,
  } as DashMessage;
}

export function createDashCancel(): DashMessage {
  return {
    type: WsMessageType.DASH_CANCEL,
  } as DashMessage;
}

// Browser event creators
export function createTabOpenEvent(): Event<'browser'> {
  return {
    type: 'browser',
    action: 'tab_open',
    timestamp: Date.now(),
  } as Event<'browser'>;
}

export function createTabCloseEvent(): Event<'browser'> {
  return {
    type: 'browser',
    action: 'tab_close',
    timestamp: Date.now(),
  } as Event<'browser'>;
}

export function createWebsiteVisitEvent(
  tabId: number,
  url: string
): Event<'browser'> {
  return {
    type: 'browser',
    action: 'website_visit',
    timestamp: Date.now(),
    payload: {
      tabId,
      url,
    },
  } as Event<'browser'>;
}

// Server -> Client message creators (with dashId)
export function createDashInitAck(dashId: string): DashMessage {
  return {
    type: WsMessageType.DASH_INIT_ACK,
    dashId,
    status: 'idle' as const,
  } as DashMessage;
}

export function createEventBroadcast(
  dashId: string,
  event: Event<'stopwatch' | 'browser'>
): DashMessage {
  return {
    type: WsMessageType.EVENT_BROADCAST,
    dashId,
    event,
  } as DashMessage;
}

export function createDashCompleteAck(dashId: string): DashMessage {
  return {
    type: WsMessageType.DASH_COMPLETE_ACK,
    dashId,
  } as DashMessage;
}

export function createDashCancelAck(dashId: string): DashMessage {
  return {
    type: WsMessageType.DASH_CANCEL_ACK,
    dashId,
  } as DashMessage;
}

export function createDashError(
  error: string,
  dashId?: string,
  code?: string
): DashMessage {
  return {
    type: WsMessageType.DASH_ERROR,
    error,
    ...(dashId && { dashId }),
    ...(code && { code }),
  } as DashMessage;
}
