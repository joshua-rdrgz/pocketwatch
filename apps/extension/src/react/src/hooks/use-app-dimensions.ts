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

    const element = document.getElementById(PANEL_CONTENT_ID);
    if (!element) return;

    // Observe DOM changes to auto-resize panel when content changes
    const mutationObserver = new MutationObserver(checkAndNotifySize);
    mutationObserver.observe(element, {
      childList: true,
      subtree: true,
    });

    // Listen for relevant 'scale' transitions to recheck and sync size.
    const handleTransitionEnd = (e: TransitionEvent) => {
      if (e.propertyName === 'scale') {
        checkAndNotifySize();
      }
    };

    element.addEventListener('transitionend', handleTransitionEnd, true);

    return () => {
      mutationObserver.disconnect();
      element.removeEventListener('transitionend', handleTransitionEnd, true);
    };
  }, []);
}
