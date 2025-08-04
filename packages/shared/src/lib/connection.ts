import { Message, MessageType } from '../types/connection';

export function createMessage<T>(
  type: MessageType,
  payload?: T,
  requestId?: string
): Message<T> {
  return {
    type,
    payload,
    requestId,
    timestamp: Date.now(),
  };
}
