import { AppMode } from '@/types/app';
import { useEffect } from 'react';

interface UseAppHeightProps {
  appMode: AppMode;
}

export function useAppHeight({ appMode }: UseAppHeightProps) {
  // Notify parent iframe of content height changes
  useEffect(() => {
    const notifyResize = () => {
      const contentElement = document.getElementById('app-content');
      if (contentElement) {
        const height = contentElement.getBoundingClientRect().height;
        window.parent.postMessage({ type: 'resize', height }, '*');
      }
    };

    // Initial notification
    notifyResize();

    // Create ResizeObserver to watch for content changes
    const resizeObserver = new ResizeObserver(notifyResize);
    const contentElement = document.getElementById('app-content');
    if (contentElement) {
      resizeObserver.observe(contentElement);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [appMode]);
}
