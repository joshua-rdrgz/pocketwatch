import { ExtensionMessage, ExtensionMessageType } from '../types/connection';

// Explicit helper for extension port messages
export function createExtensionMessage<T>(
  type: ExtensionMessageType,
  payload?: T,
  requestId?: string
): ExtensionMessage<T> {
  return {
    type,
    payload,
    requestId,
    timestamp: Date.now(),
  };
}

// Generic helper for WebSocket messages
export function createWsMessage<T extends { type: string }>(
  message: T,
  requestId?: string
): T & { requestId?: string; timestamp: number } {
  return {
    ...message,
    requestId,
    timestamp: Date.now(),
  };
}
