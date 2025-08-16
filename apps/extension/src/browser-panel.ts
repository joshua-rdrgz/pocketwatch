import { createExtensionMessage } from '@repo/shared/lib/connection';
import {
  ExtensionMessageType,
  PortName,
} from '@repo/shared/types/extension-connection';

interface PanelMessage {
  type: 'resize' | 'minimize';
  height: number;
  width: number;
}

interface PanelPosition {
  x: number;
  y: number;
}

class BrowserPanelManager {
  private iframeContainer!: HTMLDivElement;
  private iframe!: HTMLIFrameElement;
  private dragHandle!: HTMLDivElement;
  private maximizeIcon!: HTMLImageElement;

  private isDragging: boolean = false;
  private currentX: number = 0;
  private currentY: number = 0;
  private initialX: number = 0;
  private initialY: number = 0;
  private xOffset: number = 0;
  private yOffset: number = 0;

  private isMinimized: boolean = false;
  private savedPosition: PanelPosition = { x: 0, y: 0 };

  private port: chrome.runtime.Port | null = null;

  constructor() {
    this.connectToServiceWorker();
  }

  private connectToServiceWorker() {
    this.port = chrome.runtime.connect({ name: PortName.POCKETWATCH });

    this.port.onMessage.addListener((msg) => {
      switch (msg.type) {
        // Browser Panel Messages
        case ExtensionMessageType.BP_UPDATE:
          this.isMinimized = msg.payload.isMinimized;
          this.xOffset = msg.payload.position.x;
          this.yOffset = msg.payload.position.y;

          if (msg.payload.initial) {
            // Initial Update, initialize panel and listeners
            this.initializePanel();
            this.setupEventListeners();
          } else {
            // Panel and listeners established, update state
            this.setTranslate(this.xOffset, this.yOffset);
            if (this.isMinimized) {
              this.iframeContainer.classList.add('minimized');
            } else {
              this.iframeContainer.classList.remove('minimized');
            }
          }
          break;
        case ExtensionMessageType.BP_SET_MINIMIZED:
          this.isMinimized = msg.payload;
          if (this.isMinimized) {
            this.iframeContainer.classList.add('minimized');
          } else {
            this.iframeContainer.classList.remove('minimized');
          }
          break;
        case ExtensionMessageType.BP_SET_POSITION:
          this.xOffset = msg.payload.x;
          this.yOffset = msg.payload.y;
          this.setTranslate(this.xOffset, this.yOffset);
          break;

        // App Settings Messages
        case ExtensionMessageType.APP_SETTINGS_UPDATE:
          // Apply theme to the panel HTML element
          this.applyTheme(msg.payload.effectiveTheme);
          break;
      }
    });

    // Handle disconnection
    this.port.onDisconnect.addListener(() => {
      this.port = null;
    });
  }

  private applyTheme(theme: 'light' | 'dark') {
    // Apply theme class to the HTML document
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }

  private initializePanel(): void {
    // Create the iframe container
    this.iframeContainer = document.createElement('div');
    this.iframeContainer.className = 'pocketwatch-panel';
    if (this.isMinimized) {
      this.iframeContainer.classList.add('minimized');
      this.xOffset = 0;
      this.yOffset = 0;
    }
    this.iframeContainer.style.width = '260px';
    this.iframeContainer.style.height = '108px';
    this.iframeContainer.style.transform = `translate3d(${this.xOffset}px, ${this.yOffset}px, 0)`;

    // Create the drag handle
    this.dragHandle = document.createElement('div');
    this.dragHandle.className = 'pocketwatch-panel-handle';
    this.iframeContainer.appendChild(this.dragHandle);

    // Create maximize icon
    this.maximizeIcon = document.createElement('img');
    this.maximizeIcon.src = chrome.runtime.getURL('assets/maximize.svg');
    this.maximizeIcon.alt = 'Maximize';
    this.maximizeIcon.className = 'maximize-icon';
    this.iframeContainer.appendChild(this.maximizeIcon);

    // Create the iframe
    this.iframe = document.createElement('iframe');
    this.iframe.className = 'pocketwatch-panel-content';

    // Set iframe source to React App
    this.iframe.src = chrome.runtime.getURL('/react/browser-panel/index.html');

    this.iframeContainer.appendChild(this.iframe);
    document.body.appendChild(this.iframeContainer);
  }

  private setupEventListeners(): void {
    // Setup panel message listener
    window.addEventListener('message', this.handlePanelMessages.bind(this));

    // Setup drag functionality
    this.dragHandle.addEventListener('mousedown', this.dragStart.bind(this));
    document.addEventListener('mousemove', this.drag.bind(this));
    document.addEventListener('mouseup', this.dragEnd.bind(this));

    // Setup click handler for expanding when minimized
    this.iframeContainer.addEventListener('click', (e) => {
      if (this.isMinimized && e.target === this.iframeContainer) {
        this.toggleMinimize();
      }
    });
    this.maximizeIcon.addEventListener('click', (e) => {
      if (this.isMinimized && e.target === this.maximizeIcon) {
        this.toggleMinimize();
      }
    });
  }

  private handlePanelMessages(event: MessageEvent): void {
    const data = event.data as PanelMessage;

    switch (data.type) {
      case 'resize': {
        const contentWidth = data.width;
        const contentHeight = data.height;

        // Container = content + handle
        const containerWidth = contentWidth + 20; // 20px for handle
        const containerHeight = contentHeight;

        this.iframeContainer.style.width = `${containerWidth}px`;
        this.iframeContainer.style.height = `${containerHeight}px`;

        // Iframe = just the content size
        this.iframe.style.width = `${contentWidth}px`;
        this.iframe.style.height = `${contentHeight}px`;
        break;
      }
      case 'minimize':
        if (!this.isMinimized) {
          this.toggleMinimize();
        }
        break;
    }
  }

  private toggleMinimize(): void {
    this.isMinimized = !this.isMinimized;
    this.sendToServiceWorker(
      ExtensionMessageType.BP_SET_MINIMIZED,
      this.isMinimized
    );

    if (this.isMinimized) {
      // Save current state before minimizing
      this.savedPosition = { x: this.xOffset, y: this.yOffset };
      this.sendToServiceWorker(ExtensionMessageType.BP_SET_POSITION, {
        x: 0,
        y: 0,
      });
    } else {
      // Restore previous state
      this.sendToServiceWorker(ExtensionMessageType.BP_SET_POSITION, {
        x: this.savedPosition.x,
        y: this.savedPosition.y,
      });
    }
  }

  private dragStart(e: MouseEvent): void {
    if (this.isMinimized) return;

    this.iframeContainer.classList.add('dragging');
    this.initialX = e.clientX - this.xOffset;
    this.initialY = e.clientY - this.yOffset;

    if (e.target === this.dragHandle) {
      this.isDragging = true;
    }
  }

  private drag(e: MouseEvent): void {
    if (this.isDragging) {
      e.preventDefault();
      this.currentX = e.clientX - this.initialX;
      this.currentY = e.clientY - this.initialY;

      this.xOffset = this.currentX;
      this.yOffset = this.currentY;

      this.setTranslate(this.currentX, this.currentY);
      this.sendToServiceWorker(ExtensionMessageType.BP_SET_POSITION, {
        x: this.xOffset,
        y: this.yOffset,
      });
    }
  }

  private setTranslate(xPos: number, yPos: number): void {
    this.iframeContainer.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  }

  private dragEnd(_e: MouseEvent): void {
    this.iframeContainer.classList.remove('dragging');
    this.initialX = this.currentX;
    this.initialY = this.currentY;
    this.isDragging = false;

    // Check and adjust if out of bounds
    if (this.checkOutOfBounds()) {
      const panelRect = this.iframeContainer.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate new x/y so the panel stays in bounds
      let newX = this.xOffset;
      let newY = this.yOffset;

      // Clamp left
      if (panelRect.left < 0) newX -= panelRect.left;
      // Clamp right
      if (panelRect.right > viewportWidth)
        newX -= panelRect.right - viewportWidth;
      // Clamp top
      if (panelRect.top < 0) newY -= panelRect.top;
      // Clamp bottom
      if (panelRect.bottom > viewportHeight)
        newY -= panelRect.bottom - viewportHeight;

      this.sendToServiceWorker(ExtensionMessageType.BP_SET_POSITION, {
        x: newX,
        y: newY,
      });
    }
  }

  private sendToServiceWorker(
    messageType: ExtensionMessageType,
    payload: PanelPosition | boolean
  ) {
    if (this.port) {
      this.port.postMessage(createExtensionMessage(messageType, payload));
    }
  }

  private checkOutOfBounds(): boolean {
    if (!this.iframeContainer) return false;
    const panelRect = this.iframeContainer.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    return (
      panelRect.left < 0 ||
      panelRect.top < 0 ||
      panelRect.right > viewportWidth ||
      panelRect.bottom > viewportHeight
    );
  }
}

// Initialize the browser panel when the page loads
new BrowserPanelManager();
