import { AppSettingsWorker } from './app-settings-worker';
import { SidePanelWorker } from './side-panel-worker';
import { StopwatchWorker } from './stopwatch-worker';

// Initialize workers
new AppSettingsWorker();
new SidePanelWorker();
new StopwatchWorker();
