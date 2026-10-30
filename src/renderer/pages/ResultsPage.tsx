import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowRight, BarChart3, RefreshCw, Clock, Trophy } from 'lucide-react';
import { ROUTES } from '../../shared/constants';

interface TestScore {
  readingWritingScore: number;
  mathScore: number;
  totalScore: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number;
  timeSpentSeconds: number;
}

export function ResultsPage() {
  const navigate = useNavigate();
  const { attemptId } = useParams<{ attemptId: string }>();
  const [score, setScore] = useState<TestScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const id = attemptId || 'latest';
        const res = await window.examDeskAPI.invoke<{ success: boolean; data?: any }>('db:get_attempt', { attemptId: id });
        if (res.success && res.data) {
          const attempt = res.data;
          const modules = attempt.modules || {};
          let correct = 0, incorrect = 0, unanswered = 0, total = 0, timeSpent = 0;
          Object.values(modules).forEach((m: any) => {
            Object.values(m.responses || {}).forEach((r: any) => {
              total++;
              if (r.isAnswered) {
                correct++;
              } else {
                unanswered++;
              }
              timeSpent += r.timeSpentSeconds || 0;
            });
          });
          const accuracy = total ? Math.round((correct / total) * 100) : 0;
          setScore({
            readingWritingScore: 400 + Math.round((correct / Math.max(total, 1)) * 200),
            mathScore: 400 + Math.round((correct / Math.max(total, 1)) * 200),
            totalScore: 800 + Math.round((correct / Math.max(total, 1)) * 400),
            correct,
            incorrect: total - correct - unanswered,
            unanswered,
            accuracy,
            timeSpentSeconds: timeSpent,
          });
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [attemptId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 animate-spin mb-2 text-slate-400" />
        <p className="text-slate-500 dark:text-slate-400">Calculating results…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link to={ROUTES.HOME} className="btn-secondary">
          <ArrowRight className="w-4 h-4 mr-2" /> Back to Home
        </Link>
      </div>

      <h1 className="text-2xl font-bold">Test Results</h1>
      <p className="text-slate-600 dark:text-slate-400">
        Your practice results are estimates only and do not represent an official SAT score.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="exam-card p-6 text-center">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Total Score</div>
          <div className="text-4xl font-bold">{score?.totalScore ?? '—'}</div>
          <div className="text-xs text-slate-500 mt-2">400–1600 scale (practice estimate)</div>
        </div>
        <div className="exam-card p-6 text-center">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reading & Writing</div>
          <div className="text-4xl font-bold">{score?.readingWritingScore ?? '—'}</div>
          <div className="text-xs text-slate-500 mt-2">200–800 scale</div>
        </div>
        <div className="exam-card p-6 text-center">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Math</div>
          <div className="text-4xl font-bold">{score?.mathScore ?? '—'}</div>
          <div className="text-xs text-slate-500 mt-2">200–800 scale</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="exam-card p-6">
          <h3 className="text-sm font-semibold mb-4">Answer Breakdown</h3>
          <div className="space-y-3">
            {[['Correct', score?.correct ?? 0, 'text-green-600 dark:text-green-400', 'bg-green-50 dark:bg-green-900/10'],
              ['Incorrect', score?.incorrect ?? 0, 'text-red-600 dark:text-red-400', 'bg-red-50 dark:bg-red-900/10'],
              ['Unanswered', score?.unanswered ?? 0, 'text-slate-500 dark:text-slate-400', 'bg-slate-50 dark:bg-slate-800']].map(([label, val, color, bg]) => (
              <div key={label} className={`flex items-center justify-between p-3 rounded ${bg}`}>
                <span className="text-sm">{label}</span>
                <span className={`text-sm font-semibold ${color}`}>{val}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800">
            <div className="text-xs text-slate-500 mb-1">Accuracy</div>
            <div className="text-2xl font-semibold">{score?.accuracy ?? 0}%</div>
          </div>
        </div>

        <div className="exam-card p-6">
          <h3 className="text-sm font-semibold mb-4">Time & Session</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Time Spent</span>
              <span className="text-sm font-medium">
                {Math.floor((score?.timeSpentSeconds ?? 0) / 60)} min {(score?.timeSpentSeconds ?? 0) % 60} sec
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Estimated Total Score</span>
              <span className="text-sm font-medium">{score?.totalScore ?? '—'}</span>
            </div>
          </div>
          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/10 rounded border border-amber-100 dark:border-amber-800">
            <p className="text-xs text-amber-700 dark:text-amber-400">
              <strong>Note:</strong> These scores are generated by a practice scoring model and are not official College Board scores.
            </p>
          </div>
        </div>
      </div>

      <div className="exam-card p-6">
        <h3 className="text-sm font-semibold mb-4">Topic Performance</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm">
          Topic-level breakdown appears here once questions are tagged with topics.
        </p>
      </div>

      <div className="flex gap-2">
        <Link to={ROUTES.REVIEW.replace(':attemptId', attemptId || 'latest')} className="btn-primary">
          <BarChart3 className="w-4 h-4 mr-2" /> Review Questions
        </Link>
        <Link to={ROUTES.HOME} className="btn-secondary">
          <Clock className="w-4 h-4 mr-2" /> Home
        </Link>
      </div>
    </div>
  );
}
