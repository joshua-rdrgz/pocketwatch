import { SidePanelHeader } from '@/components/side-panel/side-panel-header';
import { SidePanelNav } from '@/components/side-panel/side-panel-nav';

export function SidePanelPage({ children }: React.PropsWithChildren) {
  return (
    <div className="flex flex-col gap-3 min-h-screen">
      <SidePanelHeader />
      <main className="flex-1 overflow-auto px-3 pb-20">{children}</main>
      <SidePanelNav />
    </div>
  );
}
