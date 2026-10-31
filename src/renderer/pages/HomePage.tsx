import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, BarChart3, BookOpen, ChevronRight, FileUp, PlayCircle, RefreshCw } from 'lucide-react';
import type { AttemptSummary } from '@shared/types';
import { APP_VERSION, ROUTES, paths } from '../../shared/constants';
import { errorMessage, invoke } from '../lib/api';
import { resumeAttempt } from '../lib/session';
import { InlineError } from '../components/StatusMessage';

export function HomePage() {
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const fetchAttempts = useCallback(async () => {
    try {
      setAttempts(await invoke<AttemptSummary[]>('db:get_attempts'));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchAttempts();
  }, [fetchAttempts]);

  const inProgress = attempts.find((a) => a.status === 'in_progress');

  const resume = async (attemptId: string) => {
    setBusy(true);
    setError(null);
    try {
      const resumed = await resumeAttempt(attemptId);
      navigate(resumed ? ROUTES.EXAM : paths.results(attemptId));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const importTest = async () => {
    setError(null);
    try {
      const res = await invoke<{ id: string } | null>('db:import_test');
      if (res) navigate(paths.testSetup(res.id));
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const cardClass =
    'flex flex-col items-start gap-3 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors text-left';

  return (
    <div className="space-y-8">
      <div className="animate-fade-in">
        <h1 className="text-3xl font-bold tracking-tight">ExamDesk</h1>
        <p className="text-slate-600 dark:text-slate-400 mt-1">
          Digital SAT practice testing — built for focused preparation.
        </p>
      </div>

      <InlineError message={error} />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {inProgress ? (
          <button
            onClick={() => resume(inProgress.id)}
            disabled={busy}
            className="flex flex-col items-start gap-3 p-5 rounded-xl border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/10 hover:bg-brand-100 dark:hover:bg-brand-900/20 transition-colors text-left disabled:opacity-60"
          >
            <PlayCircle className="w-6 h-6 text-brand-600 dark:text-brand-400" />
            <span className="text-sm font-semibold">Continue Practice</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{inProgress.testTitle}</span>
          </button>
        ) : (
          <div className="flex flex-col items-start gap-3 p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
            <PlayCircle className="w-6 h-6 text-slate-400" />
            <span className="text-sm font-semibold">No saved session</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">Start a practice test</span>
          </div>
        )}
        <Link to={ROUTES.PRACTICE} className={cardClass}>
          <BookOpen className="w-6 h-6 text-slate-400" />
          <span className="text-sm font-semibold">Practice Library</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Browse all tests</span>
        </Link>
        <Link to={ROUTES.RESULTS} className={cardClass}>
          <BarChart3 className="w-6 h-6 text-slate-400" />
          <span className="text-sm font-semibold">Results</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Latest completed test</span>
        </Link>
        <button onClick={importTest} className={cardClass}>
          <FileUp className="w-6 h-6 text-slate-400" />
          <span className="text-sm font-semibold">Import Test</span>
          <span className="text-xs text-slate-500 dark:text-slate-400">Load a JSON test file</span>
        </button>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Previous Attempts</h2>
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <RefreshCw className="w-3 h-3 animate-spin" /> Loading
            </div>
          )}
        </div>

        {!loading && attempts.length === 0 ? (
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
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {attempts.map((a) => (
                  <tr key={a.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-medium">{a.testTitle}</td>
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
                    <td className="px-4 py-3">{new Date(a.startedAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      {a.totalScore ? a.totalScore.totalScore : <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {a.status === 'completed' ? (
                        <Link
                          to={paths.results(a.id)}
                          className="inline-flex items-center text-sm text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          Results <ChevronRight className="w-3 h-3 ml-1" />
                        </Link>
                      ) : (
                        <button
                          onClick={() => resume(a.id)}
                          disabled={busy}
                          className="inline-flex items-center text-sm text-brand-600 dark:text-brand-400 hover:underline"
                        >
                          Resume <ChevronRight className="w-3 h-3 ml-1" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800 pt-8 text-xs text-slate-500">
        ExamDesk · v{APP_VERSION}
      </div>
    </div>
  );
}
