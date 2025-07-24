import { AppSettingsWorker } from './app-settings-worker';
import { AuthWorker } from './auth-worker';
import { BrowserPanelWorker } from './browser-panel-worker';
import { SessionWorker } from './session-worker';
import { SidePanelWorker } from './side-panel-worker';

// Initialize workers
new AuthWorker();
new AppSettingsWorker();
new BrowserPanelWorker();
new SessionWorker();
new SidePanelWorker();
