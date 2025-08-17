import { WsMessageType } from '../types/websocket';
import { type SessionMessage } from '../types/session';
import { type Event } from '../types/session';

// Client -> Server message creators (no sessionId)
export function createSessionInit(): SessionMessage {
  return {
    type: WsMessageType.SESSION_INIT,
  } as SessionMessage;
}

export function createSessionAssignTask(taskId: string): SessionMessage {
  return {
    type: WsMessageType.SESSION_ASSIGN_TASK,
    taskId,
  } as SessionMessage;
}

export function createSessionEvent(event: Event): SessionMessage {
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

// Server -> Client message creators (with sessionId)
export function createSessionInitAck(sessionId: string): SessionMessage {
  return {
    type: WsMessageType.SESSION_INIT_ACK,
    sessionId,
    status: 'idle' as const,
  } as SessionMessage;
}

export function createSessionTaskAssigned(
  sessionId: string,
  taskId: string
): SessionMessage {
  return {
    type: WsMessageType.SESSION_TASK_ASSIGNED,
    sessionId,
    taskId,
  } as SessionMessage;
}

export function createEventBroadcast(
  sessionId: string,
  event: Event
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
