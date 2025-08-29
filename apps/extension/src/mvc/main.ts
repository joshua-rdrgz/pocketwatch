import {
  ExtensionMessage,
  PortName,
} from '@repo/shared/types/extension-connection';
import { AppSettingsController } from './controller/app-settings-controller';
import { AuthController } from './controller/auth-controller';
import { BrowserPanelController } from './controller/browser-panel-controller';
import { SessionController } from './controller/session-controller';
import { SidePanelController } from './controller/side-panel-controller';

class ServiceWorker {
  private appSettingsController: AppSettingsController;
  private authController: AuthController;
  private browserPanelController: BrowserPanelController;
  private sessionController: SessionController;
  private sidePanelController: SidePanelController;

  constructor() {
    // Initialize Controllers
    this.appSettingsController = new AppSettingsController();
    this.authController = new AuthController({
      onLogin: () => this.onLogin(),
      onLogout: () => this.onLogout(),
    });
    this.browserPanelController = new BrowserPanelController();
    this.sessionController = new SessionController({
      getOneTimeToken: () => this.authController.getOneTimeToken(),
    });
    this.sidePanelController = new SidePanelController();

    // Register Port Connections
    chrome.runtime.onConnect.addListener((port) => {
      switch (port.name) {
        case PortName.POCKETWATCH:
          this.appSettingsController.registerView(port);
          this.browserPanelController.registerView(port);
          this.sessionController.registerView(port);
          break;
        case PortName.SP_POCKETWATCH:
          this.sidePanelController.registerView(port);
      }
    });

    // Register Runtime Connections
    chrome.runtime.onMessage.addListener(
      (msg: ExtensionMessage, sender, sendResponse) => {
        Promise.all([
          this.authController.handleRuntimeMessage(msg, sender),
          this.sidePanelController.handleRuntimeMessage(msg, sender),
        ])
          .then(([authResult, sidePanelResult]) => {
            // Send response from whichever controller handled the message
            if (authResult !== null) {
              sendResponse(authResult);
              return;
            }
            if (sidePanelResult !== null) {
              sendResponse(sidePanelResult);
              return;
            }
          })
          .catch((error) => {
            console.error('Error handling message:', error);
            sendResponse({ success: false, error: error.message });
          });

        // Return true to indicate async response
        return true;
      }
    );

    // Initialize auth state
    this.initAuth();
  }

  private async initAuth() {
    try {
      const hasActiveSession = await this.authController.isSignedIn();
      if (hasActiveSession) {
        console.log('[mvc-service-worker] Found active session on startup');
        this.onLogin();
      }
    } catch {
      console.warn('[mvc-service-worker] No active session found on startup');
      this.onLogout();
    }
  }

  private onLogin() {
    console.log('[mvc-service-worker] onLogin called');
    this.sessionController.connectWebSocket();
  }

  private onLogout() {
    console.log('[mvc-service-worker] onLogout called');
    this.sessionController.disconnectWebSocket();
  }
}

// Initialize the service worker
new ServiceWorker();
