import { createWsMessage } from './connection';
import { WsMessageType } from '../types/websocket';
import { type SessionMessage } from '../types/session';
import { type Event } from '../types/session';

export function createSessionStart(
  sessionId?: string,
  requestId?: string
): SessionMessage {
  return createWsMessage(
    {
      type: WsMessageType.SESSION_START,
      sessionId: sessionId ?? '',
    },
    requestId
  );
}

export function createSessionEvent(
  sessionId: string,
  event: Event,
  requestId?: string
): SessionMessage {
  return createWsMessage(
    {
      type: WsMessageType.SESSION_EVENT,
      sessionId,
      event,
    },
    requestId
  );
}

export function createEventBroadcast(
  sessionId: string,
  event: Event,
  requestId?: string
): SessionMessage {
  return createWsMessage(
    {
      type: WsMessageType.EVENT_BROADCAST,
      sessionId,
      event,
    },
    requestId
  );
}

export function createSessionComplete(
  sessionId: string,
  requestId?: string
): SessionMessage {
  return createWsMessage(
    {
      type: WsMessageType.SESSION_COMPLETE,
      sessionId,
    },
    requestId
  );
}

export function createSessionCancel(
  sessionId: string,
  requestId?: string
): SessionMessage {
  return createWsMessage(
    {
      type: WsMessageType.SESSION_CANCEL,
      sessionId,
    },
    requestId
  );
}

export function createSessionError(
  sessionId: string,
  error: string,
  requestId?: string
): SessionMessage {
  return createWsMessage(
    {
      type: WsMessageType.SESSION_ERROR,
      sessionId,
      error,
    },
    requestId
  );
}
