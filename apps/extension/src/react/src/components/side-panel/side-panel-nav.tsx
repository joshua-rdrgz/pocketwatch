import { Timer } from 'lucide-react';
import { NavLink } from 'react-router';

export function SidePanelNav() {
  return (
    <nav className="fixed bottom-2 left-1/2 transform -translate-x-1/2 bg-primary rounded-full px-3 py-1.5 border shadow-lg z-50">
      <ul className="flex items-center justify-center">
        <li>
          <NavLink
            to="/dash"
            className="flex items-center justify-center w-13 h-13 rounded-full transition-all duration-100 shadow-md bg-accent text-accent-foreground shadow-accent/25 -mt-4"
          >
            <Timer className="h-8 w-8" />
          </NavLink>
        </li>
      </ul>
    </nav>
  );
}
