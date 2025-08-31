import { WsMessageType } from '../types/websocket';
import { type DashMessage, type DashEvent } from '../types/dash';

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

export function createDashEvent(event: DashEvent): DashMessage {
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

// Stopwatch event creators
export function createStopwatchEvent(
  action: 'start' | 'break' | 'resume' | 'finish'
): DashEvent {
  return {
    action,
    timestamp: Date.now(),
  };
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
  event: DashEvent
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
