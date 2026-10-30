import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, HelpCircle, Monitor, Palette, Clock as ClockIcon } from 'lucide-react';
import { ROUTES } from '../../shared/constants';
import { useAppStore } from '../store/useAppStore';

export function SettingsPage() {
  const navigate = useNavigate();
  const { theme, userPreferences, setTheme, setUserPreferences } = useAppStore();

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <Link to={ROUTES.HOME} className="btn-secondary">
          <ArrowRight className="w-4 h-4 mr-2" /> Back to Home
        </Link>
      </div>

      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="exam-card p-6 space-y-6">
        <div>
          <h2 className="text-sm font-semibold mb-4">Appearance</h2>
          <div className="space-y-3">
            <label className="flex items-center justify-between p-3 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer">
              <span>Theme</span>
              <button
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
                className="w-12 h-6 rounded-full bg-slate-200 dark:bg-slate-600 relative transition-colors focus-visible:ring-2 focus-visible:ring-brand-500"
                aria-pressed={theme === 'dark'}
              >
                <span className={`block w-5 h-5 rounded-full bg-white shadow-sm ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </label>
            <p className="text-xs text-slate-500 mt-1">Choose light or dark mode.</p>
          </div>
        </div>

        <div>
          <h2 className="text-sm font-semibold mb-4">Test Options</h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 p-3 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={userPreferences.timerVisible}
                onChange={(e) => setUserPreferences({ timerVisible: e.target.checked })}
                className="rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500"
              />
              <span>Show countdown timer during exams</span>
            </label>
            <label className="flex items-center gap-3 p-3 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={userPreferences.highContrast}
                onChange={(e) => setUserPreferences({ highContrast: e.target.checked })}
                className="rounded border-slate-300 dark:border-slate-600 text-brand-600 focus:ring-brand-500"
              />
              <span>High contrast mode</span>
            </label>
          </div>
        </div>
      </div>

      <div className="exam-card p-6 space-y-6">
        <h2 className="text-sm font-semibold mb-4">Keyboard Shortcuts</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/30 rounded">
            <span className="w-6 h-6 rounded border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs font-mono">→</span>
            <span className="text-slate-600 dark:text-slate-400">Next question</span>
          </div>
          <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/30 rounded">
            <span className="w-6 h-6 rounded border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs font-mono">←</span>
            <span className="text-slate-600 dark:text-slate-400">Previous question</span>
          </div>
          <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/30 rounded">
            <span className="w-6 h-6 rounded border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs font-mono">R</span>
            <span className="text-slate-600 dark:text-slate-400">Mark for review</span>
          </div>
          <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/30 rounded">
            <span className="w-6 h-6 rounded border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs font-mono">T</span>
            <span className="text-slate-600 dark:text-slate-400">Toggle timer visibility</span>
          </div>
          <div className="flex items-center gap-3 p-2 bg-slate-50 dark:bg-slate-800/30 rounded">
            <span className="w-6 h-6 rounded border border-slate-300 dark:border-slate-600 flex items-center justify-center text-xs font-mono">Esc</span>
            <span className="text-slate-600 dark:text-slate-400">Return home</span>
          </div>
        </div>
      </div>

      <div className="exam-card p-6 border-t border-slate-200 dark:border-slate-800 pt-6">
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
          <span>ExamDesk v1.0.0</span>
          <span>Digital SAT Practice Application</span>
        </div>
      </div>
    </div>
  );
}
