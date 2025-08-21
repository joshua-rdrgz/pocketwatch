import {
  ExtensionMessage,
  ExtensionMessageType,
} from '../types/extension-connection';

/**
 * Creates a properly typed extension message with the given type and optional payload.
 *
 * @param type - The extension message type
 * @param payload - Optional payload data
 * @returns A properly formatted extension message
 */
export function createExtensionMessage<T = unknown>(
  type: ExtensionMessageType,
  payload?: T
): ExtensionMessage<T> {
  return {
    type,
    payload,
    timestamp: Date.now(),
  };
}
