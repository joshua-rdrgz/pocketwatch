import { WsMessageType } from '../types/websocket';
import { type DashMessage, type DashEvent, DashData } from '../types/dash';
import { DashInfo } from './dash';

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

export function createDashInfoChange(dashInfo: DashInfo): DashMessage {
  return {
    type: WsMessageType.DASH_INFO_CHANGE,
    dashInfo,
  } as DashMessage;
}

export function createDashEvent(event: DashEvent): DashMessage {
  return {
    type: WsMessageType.DASH_EVENT,
    event,
  } as DashMessage;
}

export function createDashEventAdjust(events: DashEvent[]): DashMessage {
  return {
    type: WsMessageType.DASH_EVENT_ADJUST,
    events,
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

// Server -> Client message creators (with dashId)
export function createDashInitAck(): DashMessage {
  return {
    type: WsMessageType.DASH_INIT_ACK,
    status: 'initialized' as const,
  } as DashMessage;
}

export function createEventBroadcast(
  eventOrEvents: DashEvent | DashEvent[],
  operation: 'add' | 'adjust'
): DashMessage {
  return {
    type: WsMessageType.EVENT_BROADCAST,
    eventOrEvents,
    operation,
  } as DashMessage;
}

export function createDashMetadataBroadcast(metadata: DashInfo): DashMessage {
  return {
    type: WsMessageType.DASH_INFO_CHANGE_BROADCAST,
    dashInfo: metadata,
  } as DashMessage;
}

export function createDashCompleteAck(): DashMessage {
  return {
    type: WsMessageType.DASH_COMPLETE_ACK,
  } as DashMessage;
}

export function createDashCancelAck(): DashMessage {
  return {
    type: WsMessageType.DASH_CANCEL_ACK,
  } as DashMessage;
}

export function createDashError(error: string, code?: string): DashMessage {
  return {
    type: WsMessageType.DASH_ERROR,
    error,
    ...(code && { code }),
  } as DashMessage;
}
