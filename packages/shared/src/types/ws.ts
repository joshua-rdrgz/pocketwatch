import { WebSocketMessage } from '../lib/websocket-manager';

export interface CounterMessage extends WebSocketMessage {
  type: 'INCREMENT' | 'GET_COUNT' | 'COUNT_UPDATE';
  count?: number;
}
