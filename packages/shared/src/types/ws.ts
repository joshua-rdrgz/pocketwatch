import { Event } from './session';
import { WebSocketMessage, WsMessageType } from './websocket';

export type SessionMessage = WebSocketMessage &
  (
    | {
        type: WsMessageType.SESSION_START;
        sessionId: string;
      }
    | {
        type: WsMessageType.SESSION_EVENT;
        sessionId: string;
        event: Event;
      }
    | {
        type: WsMessageType.SESSION_COMPLETE;
        sessionId: string;
      }
    | {
        type: WsMessageType.SESSION_CANCEL;
        sessionId: string;
      }
    | {
        type: WsMessageType.EVENT_BROADCAST;
        sessionId: string;
        event: Event;
      }
    | {
        type: WsMessageType.SESSION_ERROR;
        sessionId: string;
        error: string;
      }
  );
