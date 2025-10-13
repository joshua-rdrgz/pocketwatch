import { SidePanelHeader } from '@/components/side-panel/side-panel-header';
import { SidePanelNav } from '@/components/side-panel/side-panel-nav';
import { useElementHeight } from '@/hooks/use-element-height';

interface SidePanelPageProps {
  navVariant?: 'home' | 'dash' | 'none';
}

export function SidePanelPage({
  children,
  navVariant = 'none',
}: React.PropsWithChildren<SidePanelPageProps>) {
  const headerHeight = useElementHeight('[class*="fixed"][class*="top-0"]');

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
