import { Calendar, FolderKanban, Timer } from 'lucide-react';
import { NavLink } from 'react-router';

export function SidePanelNav() {
  return (
    <nav className="fixed bottom-2 left-1/2 transform -translate-x-1/2 bg-secondary rounded-full px-3 py-1.5 border shadow-lg z-50">
      <ul className="flex items-center justify-between gap-3">
        <li>
          <NavLink
            to="/calendar"
            className={({ isActive }) =>
              `flex flex-col items-center p-1 transition-colors duration-100 ${
                isActive
                  ? 'text-secondary-foreground font-medium'
                  : 'text-muted-foreground hover:text-secondary-foreground'
              }`
            }
          >
            <Calendar className="h-4 w-4" />
            <span className="text-[9px] mt-0.5">Calendar</span>
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/session"
            className="flex items-center justify-center w-13 h-13 rounded-full transition-all duration-100 shadow-md bg-accent text-accent-foreground shadow-accent/25 -mt-4"
          >
            <Timer className="h-8 w-8" />
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/projects"
            className={({ isActive }) =>
              `flex flex-col items-center p-1 transition-colors duration-100 ${
                isActive
                  ? 'text-secondary-foreground font-medium'
                  : 'text-muted-foreground hover:text-secondary-foreground'
              }`
            }
          >
            <FolderKanban className="h-4 w-4" />
            <span className="text-[9px] mt-0.5">Projects</span>
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
