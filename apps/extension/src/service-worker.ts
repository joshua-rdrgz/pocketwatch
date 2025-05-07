import { AppSettingsWorker } from './app-settings-worker.ts';
import { StopwatchWorker } from './stopwatch-worker.ts';

// Add extension icon click handler
chrome.sidePanel
  .setPanelBehavior({ openPanelOnActionClick: true })
  .catch((error) => console.error(error));

// Set up Workers
new AppSettingsWorker();
new StopwatchWorker();
