import { createWsMessage } from './connection';
import { WsMessageType } from '../types/websocket';
import { type SessionMessage } from '../types/session';
import { type Event } from '../types/session';

// Client -> Server message creators (no sessionId)
export function createSessionInit(requestId?: string): SessionMessage {
  return createWsMessage(
    {
      type: WsMessageType.SESSION_INIT,
    },
    requestId
  );
}

export function createSessionAssignTask(
  taskId: string,
  requestId?: string
): SessionMessage {
  return createWsMessage(
    {
      type: WsMessageType.SESSION_ASSIGN_TASK,
      taskId,
    },
    requestId
  );
}

export function createSessionEvent(
  event: Event,
  requestId?: string
): SessionMessage {
  return createWsMessage(
    {
      type: WsMessageType.SESSION_EVENT,
      event,
    },
    requestId
  );
}

export function createSessionComplete(requestId?: string): SessionMessage {
  return createWsMessage(
    {
      type: WsMessageType.SESSION_COMPLETE,
    },
    requestId
  );
}

export function createSessionCancel(requestId?: string): SessionMessage {
  return createWsMessage(
    {
      type: WsMessageType.SESSION_CANCEL,
    },
    requestId
  );
}

// Server -> Client message creators (with sessionId)
export function createSessionInitAck(
  sessionId: string,
  requestId?: string
): SessionMessage {
  return createWsMessage(
    {
      type: WsMessageType.SESSION_INIT_ACK,
      sessionId,
      status: 'idle' as const,
    },
    requestId
  );
}

export function createSessionTaskAssigned(
  sessionId: string,
  taskId: string,
  requestId?: string
): SessionMessage {
  return createWsMessage(
    {
      type: WsMessageType.SESSION_TASK_ASSIGNED,
      sessionId,
      taskId,
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

export function createSessionCompleteAck(
  sessionId: string,
  requestId?: string
): SessionMessage {
  return createWsMessage(
    {
      type: WsMessageType.SESSION_COMPLETE_ACK,
      sessionId,
    },
    requestId
  );
}

export function createSessionCancelAck(
  sessionId: string,
  requestId?: string
): SessionMessage {
  return createWsMessage(
    {
      type: WsMessageType.SESSION_CANCEL_ACK,
      sessionId,
    },
    requestId
  );
}

export function createSessionError(
  error: string,
  sessionId?: string,
  code?: string,
  requestId?: string
): SessionMessage {
  return createWsMessage(
    {
      type: WsMessageType.SESSION_ERROR,
      error,
      ...(sessionId && { sessionId }),
      ...(code && { code }),
    },
    requestId
  );
}
