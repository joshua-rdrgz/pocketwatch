import { SidePanelHeader } from '@/components/side-panel/side-panel-header';
import { SidePanelNav } from '@/components/side-panel/side-panel-nav';

export function SidePanelPage({ children }: React.PropsWithChildren) {
  return (
    <>
      <SidePanelHeader />
      <main className="px-3">{children}</main>
      <SidePanelNav />
    </>
  );
}
