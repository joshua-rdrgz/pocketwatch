import { BarChart3, Home, Settings } from 'lucide-react';
import { NavLink } from 'react-router';

export function SidePanelNav() {
  return (
    <nav className="fixed bottom-2 left-1/2 transform -translate-x-1/2 bg-secondary/50 backdrop-blur-md rounded-full px-3 py-2 border shadow-sm">
      <ul className="flex items-center justify-between gap-4">
        <li>
          <NavLink
            to="/overview"
            className={({ isActive }) =>
              `flex flex-col items-center p-1 ${isActive ? 'text-secondary-foreground font-medium' : 'text-muted-foreground'}`
            }
          >
            <Home className="h-4 w-4" />
            <span className="text-[10px] mt-0.5">Overview</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/details"
            className={({ isActive }) =>
              `flex flex-col items-center p-1 ${isActive ? 'text-secondary-foreground font-medium' : 'text-muted-foreground'}`
            }
          >
            <BarChart3 className="h-4 w-4" />
            <span className="text-[10px] mt-0.5">Details</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/settings"
            className={({ isActive }) =>
              `flex flex-col items-center p-1 ${isActive ? 'text-secondary-foreground font-medium' : 'text-muted-foreground'}`
            }
          >
            <Settings className="h-4 w-4" />
            <span className="text-[10px] mt-0.5">Settings</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
