import { useNavigate } from 'react-router-dom';
import { Moon, Sun, Settings } from 'lucide-react';
import { APP_VERSION, ROUTES } from '../../../shared/constants';
import { useAppStore } from '../../store/useAppStore';

export function Navbar() {
  const navigate = useNavigate();
  const { theme, setTheme } = useAppStore();

  return (
    <div className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur">
      <div className="flex items-center justify-between h-12 px-6">
        <div className="flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          <span>v{APP_VERSION}</span>
          <span className="mx-1">·</span>
          <span>Digital SAT Practice</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="btn-ghost"
            aria-label={theme === 'light' ? 'Switch to dark theme' : 'Switch to light theme'}
          >
            {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </button>
          <button onClick={() => navigate(ROUTES.SETTINGS)} className="btn-ghost" aria-label="Settings">
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
