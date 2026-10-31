import { useMemo } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BarChart3, BookOpen } from 'lucide-react';
import { collectResponses, isResponseCorrect, scoreAttempt } from '@shared/exam';
import { ROUTES, paths } from '../../shared/constants';
import { useAttemptData } from '../lib/useAttemptData';
import { formatDuration } from '../lib/format';
import { ErrorCard, Loading } from '../components/StatusMessage';

export function ResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const data = useAttemptData(attemptId);

  const computed = useMemo(() => {
    if (data.status !== 'ready') return null;
    const { attempt, content } = data;
    const score = attempt.totalScore ?? scoreAttempt(content, attempt);
    const responses = collectResponses(attempt);
    const topics = new Map<string, { correct: number; total: number }>();
    for (const q of content.questions) {
      const key = q.topic ?? 'Other';
      const t = topics.get(key) ?? { correct: 0, total: 0 };
      t.total++;
      if (isResponseCorrect(q, responses[q.id])) t.correct++;
      topics.set(key, t);
    }
    return { score, topics: [...topics.entries()].sort((a, b) => a[0].localeCompare(b[0])) };
  }, [data]);

  if (data.status === 'loading') return <Loading label="Calculating results…" />;
  if (data.status === 'error') return <ErrorCard message={data.error} />;
  if (data.status === 'empty' || !computed) {
    return (
      <ErrorCard message={attemptId ? 'Attempt not found' : 'No completed tests yet'}>
        <Link to={ROUTES.PRACTICE} className="btn-primary">
          <BookOpen className="w-4 h-4 mr-2" /> Start a practice test
        </Link>
      </ErrorCard>
    );
  }

  const { attempt, content } = data;
  const { score, topics } = computed;
  const inProgress = attempt.status !== 'completed';

  return (
    <div className="space-y-6">
      <Link to={ROUTES.HOME} className="btn-secondary">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Test Results</h1>
        <p className="text-slate-600 dark:text-slate-400">
          {content.metadata.title} · {new Date(attempt.startedAt).toLocaleString()}
          {inProgress && ' · in progress (partial results)'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ScoreCard label="Total Score" value={score.totalScore} hint="practice estimate" />
        <ScoreCard label="Reading & Writing" value={score.readingWritingScore} hint="200–800" />
        <ScoreCard label="Math" value={score.mathScore} hint="200–800" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="exam-card p-6">
          <h3 className="text-sm font-semibold mb-4">Answer Breakdown</h3>
          <div className="space-y-3">
            <Row label="Correct" value={score.correct} className="text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/10" />
            <Row label="Incorrect" value={score.incorrect} className="text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/10" />
            <Row label="Unanswered" value={score.unanswered} className="text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800" />
          </div>
          <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-800 flex justify-between">
            <div>
              <div className="text-xs text-slate-500 mb-1">Accuracy</div>
              <div className="text-2xl font-semibold">{score.accuracy}%</div>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 mb-1">Time spent</div>
              <div className="text-2xl font-semibold">{formatDuration(score.timeSpentSeconds)}</div>
            </div>
          </div>
        </div>

        <div className="exam-card p-6">
          <h3 className="text-sm font-semibold mb-4">Topic Performance</h3>
          <div className="space-y-3">
            {topics.map(([topic, t]) => {
              const pct = t.total ? Math.round((t.correct / t.total) * 100) : 0;
              return (
                <div key={topic}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{topic}</span>
                    <span className="text-slate-500">
                      {t.correct}/{t.total}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        Scores are a simple linear estimate from the share of correct answers and are not official College Board scores.
      </p>

      <Link to={paths.review(attempt.id)} className="btn-primary">
        <BarChart3 className="w-4 h-4 mr-2" /> Review Questions
      </Link>
    </div>
  );
}

function ScoreCard({ label, value, hint }: { label: string; value: number | null; hint: string }) {
  return (
    <div className="exam-card p-6 text-center">
      <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">{label}</div>
      <div className="text-4xl font-bold">{value ?? '—'}</div>
      <div className="text-xs text-slate-500 mt-2">{hint}</div>
    </div>
  );
}

function Row({ label, value, className }: { label: string; value: number; className: string }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded ${className}`}>
      <span className="text-sm text-slate-700 dark:text-slate-300">{label}</span>
      <span className="text-sm font-semibold">{value}</span>
    </div>
  );
}
