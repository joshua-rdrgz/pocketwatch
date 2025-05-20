interface Event {
  type: string;
  action: string;
  timestamp: number;
  payload?: string;
}

export class AppSettingsWorker {
  private hourlyRate: number = 25;
  private projectName: string = '';
  private projectDescription: string = '';
  private events: Event[] = [];
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
      hourlyRate: this.hourlyRate,
      projectName: this.projectName,
      projectDescription: this.projectDescription,
      events: this.events,
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
      case 'setHourlyRate':
        this.setHourlyRate(msg.value);
        break;
      case 'setProjectName':
        this.setProjectName(msg.value);
        break;
      case 'setProjectDescription':
        this.setProjectDescription(msg.value);
        break;
      case 'addEvent':
        this.addEvent(msg.event);
        break;
      case 'clearEvents':
        this.clearEvents();
        break;
    }
  }

  setHourlyRate(rate: number) {
    this.hourlyRate = rate;
    this.sendUpdate();
  }

  setProjectName(name: string) {
    this.projectName = name;
    this.sendUpdate();
  }

  setProjectDescription(description: string) {
    this.projectDescription = description;
    this.sendUpdate();
  }

  addEvent(event: Event) {
    this.events.push(event);
    this.sendUpdate();
  }

  clearEvents() {
    this.events = [];
    this.sendUpdate();
  }
}
