import { SidePanelHeader } from '@/components/side-panel/side-panel-header';
import { SidePanelNav } from '@/components/side-panel/side-panel-nav';
import { useEffect, useState } from 'react';

interface SidePanelPageProps {
  navVariant?: 'home' | 'dash' | 'none';
}

export function SidePanelPage({
  children,
  navVariant = 'none',
}: React.PropsWithChildren<SidePanelPageProps>) {
  const [headerHeight, setHeaderHeight] = useState(0);

  /**
   * Measure header height to
   * calculate main content padding
   */
  useEffect(() => {
    const measureHeader = () => {
      grabHeader((headerEl) => {
        setHeaderHeight(headerEl.getBoundingClientRect().height);
      });
    };

    // Initial measurement
    measureHeader();

    // Re-measure on resize
    const resizeObserver = new ResizeObserver(measureHeader);

    grabHeader((headerEl) => {
      resizeObserver.observe(headerEl);
    });

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen">
      <SidePanelHeader />
      <main className="p-4" style={{ marginTop: headerHeight + 8 }}>
        {children}
      </main>
      {navVariant !== 'none' && <SidePanelNav variant={navVariant} />}
    </div>
  );
}

function grabHeader(callbackFn: (headerEl: Element) => void) {
  // Find the existing fixed header in the DOM
  const headerElement = document.querySelector(
    '[class*="fixed"][class*="top-0"]'
  );
  if (headerElement) {
    callbackFn(headerElement);
  }
}
