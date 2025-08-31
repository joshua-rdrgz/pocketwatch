import { WsMessageType } from '../types/websocket';
import { type SessionMessage } from '../types/session';
import { type Event } from '../types/session';

// Generic type for message creator functions
export type MessageCreator<T extends readonly unknown[] = []> = (
  ...args: T
) => SessionMessage;

// Client -> Server message creators (no sessionId)
export function createSessionInit(): SessionMessage {
  return {
    type: WsMessageType.SESSION_INIT,
  } as SessionMessage;
}

export function createSessionEvent(
  event: Event<'stopwatch' | 'browser'>
): SessionMessage {
  return {
    type: WsMessageType.SESSION_EVENT,
    event,
  } as SessionMessage;
}

export function createSessionComplete(): SessionMessage {
  return {
    type: WsMessageType.SESSION_COMPLETE,
  } as SessionMessage;
}

export function createSessionCancel(): SessionMessage {
  return {
    type: WsMessageType.SESSION_CANCEL,
  } as SessionMessage;
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

// Server -> Client message creators (with sessionId)
export function createSessionInitAck(sessionId: string): SessionMessage {
  return {
    type: WsMessageType.SESSION_INIT_ACK,
    sessionId,
    status: 'idle' as const,
  } as SessionMessage;
}

export function createEventBroadcast(
  sessionId: string,
  event: Event<'stopwatch' | 'browser'>
): SessionMessage {
  return {
    type: WsMessageType.EVENT_BROADCAST,
    sessionId,
    event,
  } as SessionMessage;
}

export function createSessionCompleteAck(sessionId: string): SessionMessage {
  return {
    type: WsMessageType.SESSION_COMPLETE_ACK,
    sessionId,
  } as SessionMessage;
}

export function createSessionCancelAck(sessionId: string): SessionMessage {
  return {
    type: WsMessageType.SESSION_CANCEL_ACK,
    sessionId,
  } as SessionMessage;
}

export function createSessionError(
  error: string,
  sessionId?: string,
  code?: string
): SessionMessage {
  return {
    type: WsMessageType.SESSION_ERROR,
    error,
    ...(sessionId && { sessionId }),
    ...(code && { code }),
  } as SessionMessage;
}
