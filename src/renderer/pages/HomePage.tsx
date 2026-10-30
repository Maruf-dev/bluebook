import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../shared/constants';
import { useAppStore } from '../store/useAppStore';

interface TestAttempt {
  id: string;
  test_id: string;
  started_at: number;
  completed_at?: number;
  status: string;
  total_score?: string;
}

export function HomePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useAppStore();
  const [attempts, setAttempts] = useState<TestAttempt[]>([]);
  const [loading, setLoading] = useState(true);
  const [continueTestId, setContinueTestId] = useState<string | null>(null);

  const fetchAttempts = useCallback(async () => {
    try {
      const res = await window.examDeskAPI.invoke<{ success: boolean; data?: TestAttempt[] }>('db:get_attempts');
      if (res.success && res.data) {
        setAttempts(res.data);
        const inProgress = res.data.find((a) => a.status === 'in_progress');
        setContinueTestId(inProgress?.id ?? null);
      }
    } catch (e) {
      console.error('Failed to load attempts', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAttempts();
  }, [fetchAttempts]);

  const handleImportTest = async () => {
    try {
      const res = await window.examDeskAPI.invoke<{ success: boolean; data?: any }>('db:import_test');
      if (res.success) navigate(ROUTES.PRACTICE);
    } catch (e) {
      console.error('Import failed', e);
    }
  };

  const continuePractice = () => {
    if (continueTestId) navigate(`${ROUTES.REVIEW.replace(':attemptId', continueTestId)}`);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">ExamDesk</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Digital SAT practice testing — built for focused preparation.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
            className="btn-ghost"
            aria-label="Toggle theme"
          >
            {theme === 'light' ? (
              <Menu className="w-4 h-4" />
            ) : (
              <HelpCircle className="w-4 h-4" />
            )}
          </button>
          <button onClick={() => navigate(ROUTES.SETTINGS)} className="btn-secondary">
            <Settings icon={SettingsIcon} className="w-4 h-4 mr-2" /> Settings
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {continueTestId ? (
          <a
            onClick={continuePractice}
            className="flex flex-col items-start gap-3 p-5 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/10 hover:bg-brand-100 dark:hover:bg-brand-900/20 transition-colors"
            aria-label="Continue practice"
          >
            <Menu className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              Continue Practice
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Resume saved session
            </span>
          </a>
        ) : (
          <div className="flex flex-col items-start gap-3 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <Menu className="w-6 h-6 text-slate-400" />
            <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">No saved session</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Start a practice test</span>
          </div>
        )}
        <Link
          to={ROUTES.PRACTICE}
          className="flex flex-col items-start gap-3 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <BookOpen className="w-6 h-6 text-slate-400" />
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Practice Library</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Browse all tests</span>
        </Link>
        <Link
          to={ROUTES.RESULTS}
          className="flex flex-col items-start gap-3 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <BarChart3 className="w-6 h-6 text-slate-400" />
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Results</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Review attempts</span>
        </Link>
        <button
          onClick={handleImportTest}
          className="flex flex-col items-start gap-3 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
        >
          <FileText className="w-6 h-6 text-slate-400" />
          <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">Import Test</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Load JSON test</span>
        </button>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Previous Attempts</h2>
          {loading ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <RefreshCw className="w-3 h-3 animate-spin" /> Loading
            </div>
          ) : null}
        </div>

        {attempts.length === 0 && loading === false ? (
          <div className="exam-card p-8 text-center">
            <Activity className="w-10 h-10 mx-auto mb-3 text-slate-400" />
            <p className="text-slate-500 dark:text-slate-400">
              No attempts yet. Start your first practice test to see results here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-800">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Test</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-slate-500">Date</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-slate-500">Score</th>
                  <th className="px-4 py-3 text-right" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {attempts.map((a) => {
                  const score = a.total_score ? JSON.parse(a.total_score) : null;
                  const date = new Date(a.started_at).toLocaleDateString();
                  return (
                    <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium">Practice Test</div>
                        <div className="text-xs text-slate-500">ID: {a.id.slice(-6)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            a.status === 'completed'
                              ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                              : 'bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400'
                          }`}
                        >
                          {a.status === 'completed' ? 'Completed' : 'In Progress'}
                        </span>
                      </td>
                      <td className="px-4 py-3">{date}</td>
                      <td className="px-4 py-3 text-right">
                        {score ? (
                          <span className="font-medium">{score.totalScore}</span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link
                          to={`${ROUTES.REVIEW.replace(':attemptId', a.id)}`}
                          className="text-sm text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          Review <ChevronRight className="w-3 h-3 ml-1" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-500 dark:text-slate-500">
        <div className="flex items-center gap-2">
          <span>ExamDesk</span>
          <span className="text-slate-400">·</span>
          <span>v{import.meta.env.VITE_VERSION ?? '1.0.0'}</span>
        </div>
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(ROUTES.SETTINGS)} className="hover:text-brand-600 dark:hover:text-brand-400">
            Settings
          </button>
          <button onClick={() => navigate(ROUTES.HOME)} className="hover:text-brand-600 dark:hover:text-brand-400">
            Shortcuts
          </button>
        </div>
      </div>
    </div>
  );
}
