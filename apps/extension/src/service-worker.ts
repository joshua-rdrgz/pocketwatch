import { AppSettingsWorker } from './app-settings-worker';
import { BrowserPanelWorker } from './browser-panel-worker';
import { SidePanelWorker } from './side-panel-worker';
import { StopwatchWorker } from './stopwatch-worker';

// Initialize workers
new AppSettingsWorker();
new BrowserPanelWorker();
new SidePanelWorker();
new StopwatchWorker();
