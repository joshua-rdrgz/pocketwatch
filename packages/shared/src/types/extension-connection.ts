// Extension Port message types
export enum ExtensionMessageType {
  // ==== Authentication Messages ====
  AUTH_GET_USER_SESSION = 'AUTH_GET_USER_SESSION',
  AUTH_GOOGLE_SIGN_IN = 'AUTH_GOOGLE_SIGN_IN',
  AUTH_GOOGLE_SIGN_OUT = 'AUTH_GOOGLE_SIGN_OUT',
  AUTH_SET_OAUTH_LOADING = 'AUTH_SET_OAUTH_LOADING',
  AUTH_SIGNIN_SUCCESSFUL = 'AUTH_SIGNIN_SUCCESSFUL',
  AUTH_SIGNOUT_SUCCESSFUL = 'AUTH_SIGNOUT_SUCCESSFUL',

  // ==== App Settings Messages ====
  APP_SETTINGS_UPDATE = 'APP_SETTINGS_UPDATE',
  APP_SETTINGS_SET_THEME = 'APP_SETTINGS_SET_THEME',
  APP_SETTINGS_GET_STATE = 'APP_SETTINGS_GET_STATE',

  // ==== Browser Panel Messages ====
  BP_UPDATE = 'BP_UPDATE',
  BP_SET_MINIMIZED = 'BP_SET_MINIMIZED',
  BP_SET_POSITION = 'BP_SET_POSITION',
  BP_GET_MINIMIZED = 'BP_GET_MINIMIZED',
  BP_GET_POSITION = 'BP_GET_POSITION',
  BP_INITIAL_STATE = 'BP_INITIAL_STATE',

  // ==== Side Panel Messages ====
  SP_REGISTER_WINDOW = 'SP_REGISTER_WINDOW',
  SP_TOGGLE = 'SP_TOGGLE',
  SP_GET_STATE = 'SP_GET_STATE',
  SP_STATE_CHANGED = 'SP_STATE_CHANGED',
  SP_CLOSE = 'SP_CLOSE',

  // ==== Session Lifecycle Messages ====
  SESSION_INIT = 'SESSION_INIT',
  SESSION_ASSIGN_TASK = 'SESSION_ASSIGN_TASK',
  SESSION_UNASSIGN_TASK = 'SESSION_UNASSIGN_TASK',
  SESSION_EVENT = 'SESSION_EVENT',
  SESSION_COMPLETE = 'SESSION_COMPLETE',
  SESSION_CANCEL = 'SESSION_CANCEL',
  SESSION_SYNC = 'SESSION_SYNC',
  SESSION_URL_CLICK = 'SESSION_URL_CLICK',
}

export enum PortName {
  POCKETWATCH = 'POCKETWATCH',
  SP_POCKETWATCH = 'SP_POCKETWATCH', // Side panel special connection
}

// Message structure for all communications
export interface ExtensionMessage<T = unknown> {
  type: ExtensionMessageType;
  payload?: T;
  error?: string;
  timestamp?: number;
}

// Generic utility type for creating typed messages with specific MessageType and payload
export interface TypedExtensionMessage<
  T extends ExtensionMessageType,
  P = unknown,
> extends ExtensionMessage<P> {
  type: T;
  payload: P;
}

// Response structure for runtime messages
export interface ExtensionRuntimeResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: unknown;
  requestId?: string;
}
