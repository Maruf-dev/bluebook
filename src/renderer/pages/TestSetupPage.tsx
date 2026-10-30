import { useEffect, useState } from 'react';
import { useParams, useNavigate, useLink } from 'react-router-dom';
import { Play, ArrowRight, Clock, FileText, RefreshCw, AlertTriangle } from 'lucide-react';
import { ROUTES } from '../../shared/constants';
import { useTimerStore } from '../store/useTimerStore';

interface TestContent {
  metadata: any;
  sections: any[];
  questions: any[];
}

export function TestSetupPage() {
  const { testId } = useParams<{ testId: string }>();
  const navigate = useNavigate();
  const { startTimer } = useTimerStore();
  const [test, setTest] = useState<TestContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!testId) return;
    (async () => {
      try {
        const res = await window.examDeskAPI.invoke<{ success: boolean; data?: TestContent; error?: string }>('db:get_test', { testId });
        if (res.success && res.data) {
          setTest(res.data);
        } else {
          setError(res.error || 'Failed to load test');
        }
      } catch (e) {
        setError('Unexpected error loading test');
      } finally {
        setLoading(false);
      }
    })();
  }, [testId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin mb-2 text-slate-400" />
        <p className="text-slate-500 dark:text-slate-400">Loading test details…</p>
      </div>
    );
  }

  if (error || !test) {
    return (
      <div className="exam-card p-8 text-center">
        <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-amber-500" />
        <h2 className="font-semibold text-slate-900 dark:text-slate-100">{error || 'Test not found'}</h2>
        <Link to={ROUTES.PRACTICE} className="btn-secondary mt-4 inline-block">
          <ArrowRight className="w-4 h-4 mr-2" /> Back to Library
        </Link>
      </div>
    );
  }

  const { metadata, sections } = test;
  const totalTime = sections.reduce((sum, s) => sum + s.durationMinutes, 0);

  const handleStartTest = async () => {
    if (first) {
      const now = Date.now();
      const deadline = now + first.durationMinutes * 60 * 1000;
      startTimer(first.durationMinutes, deadline);
    }

    try {
      const attemptId = `attempt_${Date.now()}`;
      await window.examDeskAPI.invoke('db:save_attempt', {
        attempt: {
          id: attemptId,
          testId: metadata.id,
          startedAt: Date.now(),
          status: 'in_progress',
          modules: sections.reduce((acc: any, s) => {
            acc[`${s.id}-m${s.module}`] = {
              id: `${s.id}-m${s.module}`,
              sectionId: s.id,
              module: s.module,
              startedAt: Date.now(),
              deadlineAt: Date.now() + s.durationMinutes * 60 * 1000,
              durationMinutes: s.durationMinutes,
              status: 'in_progress',
              timeRemainingSeconds: s.durationMinutes * 60,
              responses: {},
              scores: null,
            };
            return acc;
          }, {}),
          totalScore: null,
        },
      });
      navigate(ROUTES.EXAM);
    } catch (e) {
      setError('Failed to initialize test session');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <Link to={ROUTES.PRACTICE} className="btn-secondary">
          <ArrowRight className="w-4 h-4 mr-2" /> Back to Library
        </Link>
      </div>

      <div className="exam-card p-8">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-12 h-12 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 text-xl">
            <FileText />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{metadata.title}</h1>
            <p className="text-slate-600 dark:text-slate-400">{metadata.description}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <p className="text-xs text-slate-500">Total Questions</p>
            <p className="text-xl font-semibold">{metadata.total_questions}</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <p className="text-xs text-slate-500">Sections</p>
            <p className="text-xl font-semibold">{sections.length}</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
            <p className="text-xs text-slate-500">Total Time</p>
            <p className="text-xl font-semibold">{totalTime} min</p>
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-sm font-semibold mb-3">Section Details</h3>
          <div className="space-y-2">
            {sections.map((s) => (
              <div key={`${s.id}-m${s.module}`} className="flex items-center justify-between p-3 rounded border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/50">
                <div>
                  <div className="text-sm font-medium">{s.name}</div>
                  <div className="text-xs text-slate-500">
                    Module {s.module} · {s.type.replace('_', ' ')}
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">{s.questionCount} questions</div>
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
                Once started, each module timer counts down independently. The timer does not pause when you switch questions or open tools.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-800">
          <p className="text-sm text-slate-500">
            Your progress is saved automatically. You can resume an unfinished session later.
          </p>
          <button
            onClick={handleStartTest}
            className="btn-primary flex items-center gap-2"
            disabled={loading}
          >
            <Play className="w-4 h-4" /> Start Test
          </button>
        </div>
      </div>
    </div>
  );
}
