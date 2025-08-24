import {
  ExtensionMessage,
  PortName,
} from '@repo/shared/types/extension-connection';
import { AppSettingsService } from './services/app-settings-service';
import { AuthService } from './services/auth-service';
import { BrowserPanelService } from './services/browser-panel-service';
import { SessionService } from './services/session-service';
import { SessionWebSocketService } from './services/session-websocket-service';
import { SidePanelService } from './services/sidepanel-service';

class ServiceWorker {
  private ports: Set<chrome.runtime.Port> = new Set();

  // Services
  private appSettingsService: AppSettingsService;
  private authService: AuthService;
  private browserPanelService: BrowserPanelService;
  private sessionService: SessionService;
  private sessionWebSocketService: SessionWebSocketService;
  private sidePanelService: SidePanelService;

  constructor() {
    // Initialize Services
    this.appSettingsService = new AppSettingsService({
      onUpdate: this.onUpdate,
    });
    this.authService = new AuthService({
      onLogin: this.onLogin.bind(this),
      onLogout: this.onLogout.bind(this),
    });
    this.browserPanelService = new BrowserPanelService();
    this.sessionService = new SessionService({
      onUpdate: this.onUpdate,
    });
    this.sessionWebSocketService = new SessionWebSocketService({
      getOneTimeToken: this.authService.getOneTimeToken.bind(this.authService),
    });
    this.sidePanelService = new SidePanelService();

    // Register Port Connections
    chrome.runtime.onConnect.addListener((port) => {
      switch (port.name) {
        case PortName.POCKETWATCH:
          this.registerRegularPort(port);
          break;
        case PortName.SP_POCKETWATCH:
          this.registerSidePanelPort(port);
          break;
        default:
          console.error('[ServiceWorker] 🔥 Invalid Port name: ', port.name);
          port.disconnect();
      }
    });

    // Register Runtime Connections
    chrome.runtime.onMessage.addListener(
      (msg: ExtensionMessage, sender, sendResponse) => {
        // Handle Auth messages (async)
        this.authService
          .handleRuntimeMessage(msg)
          .then((authResult) => {
            if (authResult !== null) {
              sendResponse(authResult);
              return;
            }
          })
          .catch((error) => {
            console.error('Error handling auth message:', error);
            sendResponse({ success: false, error: error.message });
          });

        // Handle SidePanel messages (sync)
        const sidePanelResult = this.sidePanelService.handleRuntimeMessage(
          msg,
          sender
        );
        if (sidePanelResult !== null) {
          sendResponse(sidePanelResult);
          return true;
        }

        // Return true to indicate async response
        return true;
      }
    );

    // Initialize WebSocket Connection
    this.initWebSocket();
  }

  private registerRegularPort(port: chrome.runtime.Port) {
    // Register port to collection
    this.ports.add(port);

    // Handle port disconnection
    port.onDisconnect.addListener(() => {
      this.ports.delete(port);
    });

    // Run business logic
    this.appSettingsService.registerPort(port);
    this.browserPanelService.registerPort(port);
    this.sessionService.registerPort(port);
  }

  private registerSidePanelPort(port: chrome.runtime.Port) {
    // Register side panel port with the service
    this.sidePanelService.registerPort(port);
  }

  private async initWebSocket() {
    try {
      const hasActiveSession = await this.authService.isSignedIn();
      if (hasActiveSession) {
        console.log(
          '[service-worker] Found active session on startup, connecting WebSocket'
        );
        this.sessionWebSocketService.connect();
      }
    } catch {
      console.warn('[service-worker] No active session found on startup');
      this.sessionWebSocketService.disconnect();
    }
  }

  private onUpdate(message: ExtensionMessage) {
    this.ports.forEach((p) => {
      p.postMessage(message);
    });
  }

  private onLogin() {
    console.log('[service-worker] onLogin called, let us connect!');
    this.sessionWebSocketService.connect();
  }

  private onLogout() {
    console.log('[service-worker] onLogout called, let us disconnect!');
    this.sessionWebSocketService.disconnect();
  }
}

// Initialize the service worker
new ServiceWorker();
