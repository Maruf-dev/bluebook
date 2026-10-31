import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, FileUp, Play } from 'lucide-react';
import type { TestSummary } from '@shared/types';
import { paths } from '../../shared/constants';
import { errorMessage, invoke } from '../lib/api';
import { InlineError, Loading } from '../components/StatusMessage';

export function PracticePage() {
  const navigate = useNavigate();
  const [tests, setTests] = useState<TestSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setTests(await invoke<TestSummary[]>('db:get_tests'));
      } catch (e) {
        setError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const importTest = async () => {
    setError(null);
    try {
      const res = await invoke<{ id: string } | null>('db:import_test');
      if (res) navigate(paths.testSetup(res.id));
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  if (loading) return <Loading label="Loading practice tests…" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Practice Library</h1>
          <p className="text-slate-600 dark:text-slate-400">
            Browse available practice tests. Each test includes Reading &amp; Writing and Math sections.
          </p>
        </div>
        <button onClick={importTest} className="btn-secondary">
          <FileUp className="w-4 h-4 mr-2" /> Import Test
        </button>
      </div>

      <InlineError message={error} />

      {tests.length === 0 ? (
        <div className="exam-card p-12 text-center">
          <BookOpen className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <h2 className="text-lg font-semibold mb-2">No practice tests available</h2>
          <p className="text-slate-500 dark:text-slate-400 mb-6">Import a test JSON file to get started.</p>
          <button onClick={importTest} className="btn-primary">
            <FileUp className="w-4 h-4 mr-2" /> Import Test
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {tests.map((t) => (
            <button
              key={t.id}
              onClick={() => navigate(paths.testSetup(t.id))}
              className="exam-card w-full p-5 flex items-center justify-between gap-4 hover:shadow-md transition-shadow text-left"
            >
              <div className="flex-1">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100">{t.title}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">{t.description}</p>
                <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                  <span>{t.totalQuestions} questions</span>
                  <span>·</span>
                  <span>v{t.version}</span>
                </div>
              </div>
              <Play className="w-5 h-5 text-brand-600 dark:text-brand-400" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
