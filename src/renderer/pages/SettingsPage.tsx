import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { APP_VERSION, ROUTES } from '../../shared/constants';
import { useAppStore } from '../store/useAppStore';

const SHORTCUTS: Array<[string, string]> = [
  ['→', 'Next question'],
  ['←', 'Previous question'],
  ['R', 'Mark for review'],
  ['T', 'Show / hide timer'],
  ['Esc', 'Return home (outside a test)'],
];

export function SettingsPage() {
  const { theme, userPreferences, setTheme, setUserPreferences } = useAppStore();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Link to={ROUTES.HOME} className="btn-secondary">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
      </Link>

      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="exam-card p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold mb-4">Appearance</h2>
          <div className="flex items-center justify-between p-3 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800">
            <span id="theme-label">Dark mode</span>
            <button
              role="switch"
              aria-checked={theme === 'dark'}
              aria-labelledby="theme-label"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              className={`w-12 h-6 rounded-full relative transition-colors ${theme === 'dark' ? 'bg-brand-600' : 'bg-slate-300'}`}
            >
              <span
                className={`absolute top-0.5 left-0 block w-5 h-5 rounded-full bg-white shadow-sm transition-transform ${
                  theme === 'dark' ? 'translate-x-6' : 'translate-x-0.5'
                }`}
              />
            </button>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-4">Test Options</h2>
          <label className="flex items-center gap-3 p-3 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer">
            <input
              type="checkbox"
              checked={userPreferences.timerVisible}
              onChange={(e) => setUserPreferences({ timerVisible: e.target.checked })}
              className="rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500"
            />
            <span>Show countdown timer by default (it always appears in the last 5 minutes)</span>
          </label>
        </div>
      </div>

      <div className="exam-card p-6">
        <h2 className="text-sm font-semibold mb-4">Keyboard Shortcuts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
          {SHORTCUTS.map(([key, label]) => (
            <div key={key} className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/30 rounded">
              <kbd className="min-w-[2rem] h-6 px-1 rounded border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs font-mono">
                {key}
              </kbd>
              <span className="text-slate-600 dark:text-slate-400">{label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-slate-500 dark:text-slate-400">ExamDesk v{APP_VERSION} · Digital SAT Practice Application</div>
    </div>
  );
}
