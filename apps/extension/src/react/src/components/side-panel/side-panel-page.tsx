import { SidePanelHeader } from '@/components/side-panel/side-panel-header';
import { SidePanelNav } from '@/components/side-panel/side-panel-nav';
import { useDashStore } from '@/stores/dash-store';

export function SidePanelPage({ children }: React.PropsWithChildren) {
  const dashLifeCycle = useDashStore((state) => state.dashLifeCycle);
  const isDashFinished = dashLifeCycle === 'completed';

  // Calculate the proper padding-top based on header height
  // Header has pt-6 (24px) + text content + pb-2 or pb-4 (8px or 16px)
  const paddingTop = isDashFinished ? 'pt-24' : 'pt-28';

  return (
    <div className="flex flex-col gap-3 min-h-screen">
      <SidePanelHeader />
      <main className={`flex-1 overflow-auto px-3 pb-20 ${paddingTop}`}>
        {children}
      </main>
      <SidePanelNav />
    </div>
  );
}
