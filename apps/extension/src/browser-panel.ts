interface PanelMessage {
  type: 'resize' | 'minimize';
  height: number;
}

interface PanelDimensions {
  width: string;
  height: string;
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
  private savedDimensions: PanelDimensions = {
    width: '500px',
    height: '120px',
  };

  constructor() {
    this.initializePanel();
    this.setupEventListeners();
  }

  private initializePanel(): void {
    // Create the iframe container
    this.iframeContainer = document.createElement('div');
    this.iframeContainer.className = 'pocketwatch-panel';

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
        const newHeight = data.height;
        this.iframeContainer.style.height = `${newHeight}px`;
        this.iframe.style.height = `${newHeight}px`;
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

    if (this.isMinimized) {
      // Save current state before minimizing
      this.savedPosition = { x: this.xOffset, y: this.yOffset };
      this.savedDimensions = {
        width: this.iframeContainer.style.width || '300px',
        height: this.iframeContainer.style.height || '100px',
      };

      this.iframeContainer.classList.add('minimized');
      this.xOffset = 0;
      this.yOffset = 0;
      this.setTranslate(0, 0);
    } else {
      // Restore previous state
      this.iframeContainer.classList.remove('minimized');
      this.iframeContainer.style.width = this.savedDimensions.width;
      this.iframeContainer.style.height = this.savedDimensions.height;
      this.xOffset = this.savedPosition.x;
      this.yOffset = this.savedPosition.y;
      this.setTranslate(this.xOffset, this.yOffset);
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
  }
}

// Initialize the browser panel when the page loads
new BrowserPanelManager();
