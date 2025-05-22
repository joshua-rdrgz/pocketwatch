import { useEffect } from 'react';

export function useAppDimensions() {
  // Notify parent iframe of content height changes
  useEffect(() => {
    const notifyResize = () => {
      const panelContentEl = document.getElementById('panel-content');
      if (panelContentEl) {
        const dimensions = panelContentEl.getBoundingClientRect();
        const height = dimensions.height;
        const width = dimensions.width;
        window.parent.postMessage({ type: 'resize', height, width }, '*');
      }
    };

    // Initial notification
    notifyResize();

    // Create ResizeObserver to watch for content changes
    const resizeObserver = new ResizeObserver(notifyResize);
    const panelContentEl = document.getElementById('panel-content');
    if (panelContentEl) {
      resizeObserver.observe(panelContentEl);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);
}
