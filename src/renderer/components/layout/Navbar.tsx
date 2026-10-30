import { useNavigate } from 'react-router-dom';
import { AppWindow, Menu, X, Settings, HelpCircle } from 'lucide-react';
import { ROUTES } from '../../../shared/constants';
import { useAppStore } from '../../store/useAppStore';

export function Navbar() {
  const navigate = useNavigate();
  const { theme, setTheme } = useAppStore();

  return (
    <div className="sticky top-0 z-30 border-b border-slate-200 dark:border-slate-800 bg-white/80 dark:bg-slate-950/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60">
      <div className="flex items-center justify-between h-12 px-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-2 py-1 rounded-md bg-brand-600 text-white">
            <AppWindow className="w-5 h-5" />
            <span className="text-sm font-bold tracking-tight">ExamDesk</span>
          </div>
          <div className="hidden md:flex items-center gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span>v1.0.0</span>
            <span className="mx-1">·</span>
            <span>Digital SAT Practice</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="btn-ghost"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <X className="w-4 h-4" />
            ) : (
              <Menu className="w-4 h-4" />
            )}
          </button>
          <button onClick={() => navigate(ROUTES.SETTINGS)} className="btn-ghost" aria-label="Settings">
            <Settings className="w-4 h-4" />
          </button>
          <button onClick={() => navigate(ROUTES.HOME)} className="btn-ghost" aria-label="Help & shortcuts">
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
