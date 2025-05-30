import { useEffect } from 'react';

const PANEL_CONTENT_ID = 'pocketwatch-browser-panel-content';

export function useAppDimensions() {
  useEffect(() => {
    let lastWidth = 0;
    let lastHeight = 0;

    const checkAndNotifySize = () => {
      const element = document.getElementById(PANEL_CONTENT_ID);
      if (!element) return;

      // Use scrollWidth/scrollHeight - these are not affected by host page CSS
      const width = element.scrollWidth;
      const height = element.scrollHeight;

      // Only notify if dimensions actually changed (prevents feedback loops)
      if (width !== lastWidth || height !== lastHeight) {
        lastWidth = width;
        lastHeight = height;

        console.log('Size changed:', { width, height });
        window.parent.postMessage({ type: 'resize', width, height }, '*');
      }
    };

    // Initial check
    checkAndNotifySize();

    // Use ResizeObserver for performance, but with our improved measurement approach
    const resizeObserver = new ResizeObserver(checkAndNotifySize);
    const element = document.getElementById(PANEL_CONTENT_ID);
    if (element) {
      resizeObserver.observe(element);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);
}
