import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, Home, BookOpen, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { ROUTES } from '../../../shared/constants';

const navItems = [
  { href: ROUTES.HOME, label: 'Home', icon: Home },
  { href: ROUTES.PRACTICE, label: 'Practice Tests', icon: BookOpen },
  { href: ROUTES.RESULTS, label: 'Results', icon: BarChart3 },
  { href: ROUTES.SETTINGS, label: 'Settings', icon: SettingsIcon },
];

function isActive(pathname: string, href: string) {
  if (href === ROUTES.HOME) return pathname === href;
  if (href === ROUTES.RESULTS) return pathname.startsWith('/results') || pathname.startsWith('/review');
  if (href === ROUTES.PRACTICE) return pathname.startsWith('/practice') || pathname.startsWith('/test-setup');
  return pathname.startsWith(href);
}

export function Sidebar() {
  const { pathname } = useLocation();

  return (
    <aside className="hidden lg:flex lg:w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
      <div className="p-6">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-md bg-brand-600 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight">ExamDesk</span>
        </div>
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2 text-sm rounded-lg ${
                  active
                    ? 'bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-400'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
