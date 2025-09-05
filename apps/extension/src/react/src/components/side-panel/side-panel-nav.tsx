import { useDashStore } from '@/stores/dash-store';
import { Plus } from 'lucide-react';
import { HoveredButton } from '@repo/ui/components/hovered-button';
import { useNavigate } from 'react-router';
import { DashBottomNav } from './dash-bottom-nav';

interface SidePanelNavProps {
  variant: 'home' | 'dash';
}

export function SidePanelNav({ variant }: SidePanelNavProps) {
  const { initDash, dashLifeCycle } = useDashStore();
  const navigate = useNavigate();

  const handleStartNewDash = () => {
    initDash();
    navigate('/dash');
  };

  // Home Page Nav
  if (variant === 'home') {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <HoveredButton
          icon={Plus}
          iconClassName="size-6"
          onClick={handleStartNewDash}
          text="Start New Dash"
          btnClassName="min-w-14 h-14 bg-accent hover:bg-accent text-accent-foreground hover:text-accent-foreground"
        />
      </div>
    );
  }

  // Active Dash Page Nav
  if (variant === 'dash' && dashLifeCycle === 'active') {
    return <DashBottomNav />;
  }

  // Default Nav (nothing)
  return null;
}
