## WebSockets refactor (in progress)

Client-side WebSocket code has been removed from both the extension and the web app. Only the API (server) retains WebSocket functionality.

Current state:

- API server: keeps `packages/shared/src/lib/websocket-manager.ts`, `packages/shared/src/types/websocket.ts`, `packages/shared/src/types/session.ts`, and `packages/shared/src/lib/session-ws.ts` for message builders and types.
- Extension & Web: no transports, no `useWebSocket` hook, and no service worker WS bridge.

Planned redesign:

- A single shared `useWebsocket` hook in `packages/shared/src/lib/hooks/use-websocket.ts` that both the extension and web can use.
- A minimal transport abstraction injected per runtime (extension or web) to avoid duplicating logic.
