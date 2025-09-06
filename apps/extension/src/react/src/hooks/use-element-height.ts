import { useEffect, useState } from 'react';

export function useElementHeight(querySelector: string): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const measureElement = () => {
      const element = document.querySelector(querySelector);
      if (element) {
        setHeight(element.getBoundingClientRect().height);
      }
    };

    measureElement();

    const resizeObserver = new ResizeObserver(measureElement);
    const element = document.querySelector(querySelector);

    if (element) {
      resizeObserver.observe(element);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [querySelector]);

  return height;
}
