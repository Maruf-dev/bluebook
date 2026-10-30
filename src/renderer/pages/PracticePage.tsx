import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, Play, ArrowRight, RefreshCw } from 'lucide-react';
import { ROUTES } from '../../shared/constants';

interface TestSummary {
  id: string;
  title: string;
  description: string;
  version: string;
  total_questions: number;
  created_at: number;
  updated_at: number;
}

export function PracticePage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await window.examDeskAPI.invoke<{ success: boolean; data?: TestSummary[] }>('db:get_tests');
        if (res.success && res.data) setTests(res.data);
      } catch (e) {
        console.error('Failed to load tests', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin mb-2 text-slate-400" />
        <p className="text-slate-500 dark:text-slate-400">Loading practice tests…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Practice Library</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Browse available practice tests. Each test includes Reading & Writing and Math sections.
          </p>
        </div>
        <Link to={ROUTES.HOME} className="btn-secondary">
          <ArrowRight className="w-4 h-4 mr-2" /> Back to Home
        </Link>
      </div>

      {tests.length === 0 ? (
        <div className="exam-card p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <h2 className="text-lg font-semibold mb-2">No practice tests available</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">
            Import a test JSON file to get started, or add sample tests to the application data.
          </p>
          <button className="btn-primary">
            <Play className="w-4 h-4 mr-2" /> Import Test
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((t) => (
            <div
              key={t.id}
              className="exam-card p-5 flex items-center justify-between gap-4 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => navigate(`${ROUTES.TEST_SETUP.replace(':testId', t.id)}`)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter') navigate(`${ROUTES.TEST_SETUP.replace(':testId', t.id)}`);
              }}
            >
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t.description}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                  <span>{t.total_questions} questions</span>
                  <span>·</span>
                  <span>v{t.version}</span>
                </div>
              </div>
              <Play className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
