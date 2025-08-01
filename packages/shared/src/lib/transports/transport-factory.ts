import {
  WebSocketTransport,
  WebSocketTransportOptions,
} from '../../types/websocket-transport';
import { DirectWebSocketTransport } from './direct-websocket-transport';
import { ChromePortTransport } from './chrome-port-transport';

/**
 * Detects if we're running in a Chrome extension context.
 * This matches the detection pattern used throughout the extension codebase.
 */
export function isExtensionContext(): boolean {
  return (
    typeof chrome !== 'undefined' &&
    chrome.runtime &&
    typeof chrome.runtime.connect === 'function'
  );
}

/**
 * Creates the appropriate WebSocket transport based on the current environment.
 * - In Chrome extension: Uses ChromePortTransport to communicate via service worker
 * - In web app: Uses DirectWebSocketTransport for direct WebSocket connection
 */
export function createWebSocketTransport(
  options: WebSocketTransportOptions
): WebSocketTransport {
  if (isExtensionContext()) {
    console.log(
      '[TransportFactory] Creating Chrome port transport for extension context'
    );
    return new ChromePortTransport(options);
  } else {
    console.log(
      '[TransportFactory] Creating direct WebSocket transport for web context'
    );
    return new DirectWebSocketTransport(options);
  }
}
