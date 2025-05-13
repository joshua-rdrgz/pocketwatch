import { useEffect } from 'react';

export function useAppHeight() {
  // Notify parent iframe of content height changes
  useEffect(() => {
    const notifyResize = () => {
      const panelContentEl = document.getElementById('panel-content');
      if (panelContentEl) {
        const height = panelContentEl.getBoundingClientRect().height;
        window.parent.postMessage({ type: 'resize', height }, '*');
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
