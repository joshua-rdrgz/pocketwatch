import { useDashStore } from '@/stores/dash-store';
import { Plus } from 'lucide-react';
import { HoveredButton } from '@repo/ui/components/hovered-button';
import { useNavigate } from 'react-router';

export function SidePanelNav() {
  const { initDash } = useDashStore();
  const navigate = useNavigate();

  const handleStartNewDash = () => {
    initDash();
    navigate('/dash');
  };

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
