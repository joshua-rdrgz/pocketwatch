type EffectiveTheme = 'light' | 'dark';

export class AppSettingsWorker {
  private effectiveTheme: EffectiveTheme = 'light';
  private ports: chrome.runtime.Port[] = [];

  constructor() {
    // Set up port connection listener
    chrome.runtime.onConnect.addListener((port) => {
      if (port.name === 'appSettings') {
        this.ports.push(port);

        // Send initial state
        this.sendUpdate(port);

        // Set up message handler
        port.onMessage.addListener((msg) => this.handleMessage(port, msg));

        // Handle disconnection
        port.onDisconnect.addListener(() => {
          this.ports = this.ports.filter((p) => p !== port);
        });
      }
    });
  }

  private sendUpdate(port?: chrome.runtime.Port) {
    const update = {
      type: 'update',
      effectiveTheme: this.effectiveTheme,
    };

    if (port) {
      port.postMessage(update);
    } else {
      this.ports.forEach((p) => p.postMessage(update));
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private handleMessage(_port: chrome.runtime.Port, msg: any) {
    switch (msg.action) {
      case 'setTheme':
        this.setEffectiveTheme(msg.value);
        break;
    }
  }

  setEffectiveTheme(effectiveTheme: EffectiveTheme) {
    this.effectiveTheme = effectiveTheme;
    this.sendUpdate();
  }
}
