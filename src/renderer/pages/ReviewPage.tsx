import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, MinusCircle, XCircle } from 'lucide-react';
import type { Question } from '@shared/types';
import { collectResponses, getCorrectAnswerText, getModuleQuestions, getSections, isMultipleChoice, isResponseCorrect } from '@shared/exam';
import { paths } from '../../shared/constants';
import { useAttemptData } from '../lib/useAttemptData';
import { RichText } from '../components/RichText';
import { ErrorCard, Loading } from '../components/StatusMessage';

type Filter = 'all' | 'incorrect' | 'unanswered' | 'review';
type Outcome = 'correct' | 'incorrect' | 'unanswered';

const FILTERS: Array<{ id: Filter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'incorrect', label: 'Incorrect' },
  { id: 'unanswered', label: 'Unanswered' },
  { id: 'review', label: 'Marked for review' },
];

export function ReviewPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const data = useAttemptData(attemptId);
  const [filter, setFilter] = useState<Filter>('all');

  const groups = useMemo(() => {
    if (data.status !== 'ready') return [];
    const { attempt, content } = data;
    const responses = collectResponses(attempt);
    return getSections(content).map((s) => ({
      key: `${s.id}-m${s.module}`,
      title: `${s.name} — Module ${s.module}`,
      items: getModuleQuestions(content, s.id, s.module).map((q) => {
        const r = responses[q.id];
        const outcome: Outcome = !r?.isAnswered ? 'unanswered' : isResponseCorrect(q, r) ? 'correct' : 'incorrect';
        return { q, r, outcome };
      }),
    }));
  }, [data]);

  if (data.status === 'loading') return <Loading label="Loading review…" />;
  if (data.status === 'error') return <ErrorCard message={data.error} />;
  if (data.status === 'empty') return <ErrorCard message="Attempt not found" />;

  const { attempt, content } = data;
  const visible = (o: Outcome, marked: boolean) =>
    filter === 'all' || (filter === 'review' ? marked : o === filter);

  return (
    <div className="space-y-6 max-w-4xl">
      <Link to={paths.results(attempt.id)} className="btn-secondary">
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Results
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Question Review</h1>
        <p className="text-slate-600 dark:text-slate-400">{content.metadata.title}</p>
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={filter === f.id ? 'btn-primary' : 'btn-secondary'}
            aria-pressed={filter === f.id}
          >
            {f.label}
          </button>
        ))}
      </div>

      {groups.map((g) => {
        const items = g.items.filter((it) => visible(it.outcome, !!it.r?.markedForReview));
        if (items.length === 0) return null;
        return (
          <section key={g.key} className="space-y-3">
            <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{g.title}</h2>
            {items.map(({ q, r, outcome }) => (
              <ReviewItem
                key={q.id}
                q={q}
                outcome={outcome}
                answer={r ? (r.selectedOptionId ?? r.numericAnswer) : null}
                passage={q.passageId ? content.passages?.find((p) => p.id === q.passageId)?.title : undefined}
              />
            ))}
          </section>
        );
      })}

      {groups.every((g) => g.items.every((it) => !visible(it.outcome, !!it.r?.markedForReview))) && (
        <div className="exam-card p-8 text-center text-slate-500">No questions match this filter.</div>
      )}
    </div>
  );
}

const OUTCOME_UI: Record<Outcome, { icon: typeof CheckCircle2; label: string; className: string }> = {
  correct: { icon: CheckCircle2, label: 'Correct', className: 'text-green-600 dark:text-green-400' },
  incorrect: { icon: XCircle, label: 'Incorrect', className: 'text-red-600 dark:text-red-400' },
  unanswered: { icon: MinusCircle, label: 'Unanswered', className: 'text-slate-500' },
};

function ReviewItem({ q, outcome, answer, passage }: { q: Question; outcome: Outcome; answer: string | null; passage?: string }) {
  const ui = OUTCOME_UI[outcome];
  const Icon = ui.icon;
  const yourAnswer = answer == null ? '—' : isMultipleChoice(q) ? (q.options.find((o) => o.id === answer)?.label ?? '—') : answer;

  return (
    <details className="exam-card p-5 group">
      <summary className="flex items-center justify-between gap-4 cursor-pointer list-none">
        <span className="flex items-center gap-3 min-w-0">
          <Icon className={`w-5 h-5 shrink-0 ${ui.className}`} aria-label={ui.label} />
          <span className="font-mono text-sm w-6">{q.number}</span>
          <span className="truncate text-sm">
            <RichText text={q.stem} />
          </span>
        </span>
        <span className="shrink-0 text-xs text-slate-500">
          Yours: <strong>{yourAnswer}</strong> · Correct: <strong>{getCorrectAnswerText(q)}</strong>
        </span>
      </summary>
      <div className="mt-4 space-y-3 text-sm">
        {passage && <p className="text-xs text-slate-500">Passage: {passage}</p>}
        <p className="whitespace-pre-line">
          <RichText text={q.stem} />
        </p>
        {isMultipleChoice(q) && (
          <ul className="space-y-1">
            {q.options.map((o) => (
              <li
                key={o.id}
                className={`px-3 py-2 rounded border ${
                  o.isCorrect
                    ? 'border-green-400 bg-green-50 dark:bg-green-900/10'
                    : o.id === answer
                      ? 'border-red-400 bg-red-50 dark:bg-red-900/10'
                      : 'border-slate-200 dark:border-slate-700'
                }`}
              >
                <strong className="mr-2">{o.label}.</strong>
                <RichText text={o.content} />
              </li>
            ))}
          </ul>
        )}
        {q.explanation && (
          <div className="rounded bg-slate-50 dark:bg-slate-800/50 p-3">
            <div className="text-xs font-semibold text-slate-500 mb-1">Explanation</div>
            <RichText text={q.explanation} />
          </div>
        )}
        {q.topic && <p className="text-xs text-slate-500">Topic: {q.topic}{q.difficulty ? ` · ${q.difficulty}` : ''}</p>}
      </div>
    </details>
  );
}
