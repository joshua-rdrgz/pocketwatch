import { cn } from '@repo/ui/lib/utils';
import { BarChart3, Info } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router';

export function DashBottomNav() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const activeTab = searchParams.get('tab') || 'overview';

  const navItems = [
    {
      id: 'overview',
      label: 'Overview',
      icon: BarChart3,
    },
    {
      id: 'information',
      label: 'Information',
      icon: Info,
    },
  ];

  const handleTabClick = (tabId: string) => {
    navigate(`/dash?tab=${tabId}`);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-2 pb-2 min-[400px]:px-4 min-[400px]:pb-4">
      <div className="mx-auto max-w-md">
        <div className="flex items-center justify-between gap-1 min-[400px]:gap-2 rounded-full bg-card border shadow-lg p-0.5 min-[400px]:p-1 overflow-hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={cn(
                  'min-w-0 shrink flex-1 flex items-center justify-center gap-1 min-[400px]:gap-2 px-2 py-2 min-[400px]:px-4 min-[400px]:py-3 rounded-full transition-all',
                  'hover:bg-accent/50',
                  isActive && 'bg-accent text-accent-foreground shadow-sm'
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden min-[400px]:inline text-sm font-medium truncate">
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
