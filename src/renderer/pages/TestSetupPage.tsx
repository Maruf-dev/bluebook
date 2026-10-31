import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, FileText, Play } from 'lucide-react';
import type { TestContent } from '@shared/types';
import { getModuleQuestions, getSections } from '@shared/exam';
import { ROUTES } from '../../shared/constants';
import { errorMessage, invoke } from '../lib/api';
import { startAttempt } from '../lib/session';
import { ErrorCard, InlineError, Loading } from '../components/StatusMessage';

export function TestSetupPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const [test, setTest] = useState<TestContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    if (!testId) return;
    (async () => {
      try {
        setTest(await invoke<TestContent>('db:get_test', { testId }));
      } catch (e) {
        setLoadError(errorMessage(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [testId]);

  if (loading) return <Loading label="Loading test details…" />;

  if (loadError || !test || !testId) {
    return (
      <ErrorCard message={loadError || 'Test not found'}>
        <Link to={ROUTES.PRACTICE} className="btn-secondary">
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
        </Link>
      </ErrorCard>
    );
  }

  const { metadata } = test;
  const sections = getSections(test);
  const totalTime = sections.reduce((sum, s) => sum + s.durationMinutes, 0);

  const handleStart = async () => {
    setStarting(true);
    setStartError(null);
    try {
      await startAttempt(testId);
      navigate(ROUTES.EXAM);
    } catch (e) {
      setStartError(`Failed to start the test: ${errorMessage(e)}`);
      setStarting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link to={ROUTES.PRACTICE} className="btn-secondary">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Library
      </Link>

      <div className="exam-card p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400">
            <FileText />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{metadata.title}</h1>
            <p className="text-slate-600 dark:text-slate-400">{metadata.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Stat label="Total Questions" value={test.questions.length} />
          <Stat label="Modules" value={sections.length} />
          <Stat label="Total Time" value={`${totalTime} min`} />
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3">Modules</h3>
          <div className="space-y-2">
            {sections.map((s) => (
              <div
                key={`${s.id}-m${s.module}`}
                className="flex items-center justify-between p-3 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50"
              >
                <div>
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-slate-500">
                    Module {s.module}
                    {s.calculatorAllowed ? ' · calculator allowed' : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{getModuleQuestions(test, s.id, s.module).length} questions</div>
                  <div className="text-xs text-slate-500">{s.durationMinutes} min</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5" />
            <div>
              <h4 className="font-semibold text-amber-800 dark:text-amber-300">Timed session</h4>
              <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                Modules are taken in order and each has its own timer. The timer keeps running if you close the app;
                when it runs out, the module is submitted automatically.
              </p>
            </div>
          </div>
        </div>

        <InlineError message={startError} />

        <div className="flex items-center justify-between pt-6 mt-6 border-t border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500">Your answers are saved automatically.</p>
          <button onClick={handleStart} className="btn-primary flex items-center gap-2" disabled={starting}>
            <Play className="w-4 h-4" /> {starting ? 'Starting…' : 'Start Test'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  );
}
