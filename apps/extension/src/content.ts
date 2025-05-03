// Create and inject the draggable iframe
function createDraggableIframe(): void {
  // Create the iframe container
  const iframeContainer: HTMLDivElement = document.createElement('div');
  iframeContainer.id = 'draggable-iframe-container';

  // Create the drag handle
  const dragHandle: HTMLDivElement = document.createElement('div');
  dragHandle.className = 'chrome-extension-drag-handle';
  iframeContainer.appendChild(dragHandle);

  // Create the iframe
  const iframe: HTMLIFrameElement = document.createElement('iframe');
  iframe.id = 'draggable-iframe';

  // DEVELOPMENT SETUP
  const isDevelopmentMode = process.env.NODE_ENV !== 'production';
  if (isDevelopmentMode) {
    iframe.src = 'http://localhost:5173/';
  } else {
    iframe.src = chrome.runtime.getURL('/react/index.html');
  }

  iframeContainer.appendChild(iframe);

  document.body.appendChild(iframeContainer);

  // Define the message event interface
  interface ResizeMessage {
    type: string;
    height: number;
  }

  // Add message listener for iframe height updates
  window.addEventListener('message', (event: MessageEvent) => {
    const data = event.data as ResizeMessage;
    if (data.type === 'resize') {
      const newHeight: number = Math.min(Math.max(data.height, 300), 800);

      // Add 30px to account for the drag handle height
      iframeContainer.style.height = `${newHeight + 20}px`;
      iframe.style.height = `${newHeight}px`;
    }
  });

  let isDragging: boolean = false;
  let currentX: number = 0;
  let currentY: number = 0;
  let initialX: number = 0;
  let initialY: number = 0;
  let xOffset: number = 0;
  let yOffset: number = 0;

  // Add drag functionality to the drag handle
  dragHandle.addEventListener('mousedown', dragStart);
  document.addEventListener('mousemove', drag);
  document.addEventListener('mouseup', dragEnd);

  function dragStart(e: MouseEvent): void {
    initialX = e.clientX - xOffset;
    initialY = e.clientY - yOffset;

    if (e.target === dragHandle) {
      isDragging = true;
    }
  }

  function drag(e: MouseEvent): void {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      xOffset = currentX;
      yOffset = currentY;

      setTranslate(currentX, currentY, iframeContainer);
    }
  }

  function setTranslate(xPos: number, yPos: number, el: HTMLElement): void {
    el.style.transform = `translate3d(${xPos}px, ${yPos}px, 0)`;
  }

  function dragEnd(_e: MouseEvent): void {
    initialX = currentX;
    initialY = currentY;
    isDragging = false;
  }
}

// Initialize the draggable iframe when the page loads
createDraggableIframe();
