import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BookOpen, ChevronLeft, ChevronRight, Clock, Eye, EyeOff, Flag, LogOut, X } from 'lucide-react';
import type { AnswerResponse, Question } from '@shared/types';
import { getModuleQuestions, getQuestionStatus, getSections, isMultipleChoice, type QuestionStatus } from '@shared/exam';
import { DEFAULT_TIMER_WARNING_SECONDS, KEYBOARD_SHORTCUTS, ROUTES, paths } from '../../shared/constants';
import { useExamStore } from '../store/useExamStore';
import { useTimerStore } from '../store/useTimerStore';
import { useAppStore } from '../store/useAppStore';
import { saveResponse, submitCurrentModule } from '../lib/session';
import { errorMessage } from '../lib/api';
import { formatClock } from '../lib/format';
import { RichText } from '../components/RichText';
import { InlineError } from '../components/StatusMessage';

const STATUS_LABEL: Record<QuestionStatus, string> = {
  answered: 'Answered',
  review: 'For review',
  'answered-review': 'Answered · review',
  unanswered: 'Unanswered',
};

const STATUS_BADGE: Record<QuestionStatus, string> = {
  answered: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
  review: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
  'answered-review': 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300',
  unanswered: 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-300',
};

export function ExamPage() {
  const navigate = useNavigate();
  const { attempt, content, currentModuleId, currentIndex, responses, setCurrentIndex, updateResponse } =
    useExamStore();
  const { isVisible, toggleVisibility, setVisible } = useTimerStore();
  const timerPreference = useAppStore((s) => s.userPreferences.timerVisible);

  const [now, setNow] = useState(() => Date.now());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => setVisible(timerPreference), [timerPreference, setVisible]);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  const mod = attempt && currentModuleId ? attempt.modules[currentModuleId] : undefined;
  const sectionId = mod?.sectionId;
  const moduleNumber = mod?.module;

  const section = useMemo(
    () => (content && sectionId ? getSections(content).find((s) => s.id === sectionId && s.module === moduleNumber) : undefined),
    [content, sectionId, moduleNumber]
  );
  const questions = useMemo(
    () => (content && sectionId && moduleNumber != null ? getModuleQuestions(content, sectionId, moduleNumber) : []),
    [content, sectionId, moduleNumber]
  );

  const q: Question | undefined = questions[currentIndex];
  const response: AnswerResponse | undefined = q ? responses[q.id] : undefined;
  const passage = q?.passageId ? content?.passages?.find((p) => p.id === q.passageId) : undefined;

  const remaining = mod ? Math.max(0, Math.ceil((mod.deadlineAt - now) / 1000)) : 0;
  const expired = !!mod && remaining <= 0;
  const locked = expired || submitting;

  const submit = useCallback(
    async (reason: 'submitted' | 'expired') => {
      if (submittingRef.current) return;
      submittingRef.current = true;
      setSubmitting(true);
      setConfirmOpen(false);
      setError(null);
      try {
        const result = await submitCurrentModule(reason);
        if (result.finished) {
          navigate(paths.results(result.attemptId), { replace: true });
        } else {
          setNotice(
            reason === 'expired'
              ? 'Time ran out, so the previous module was submitted automatically. The next module has started.'
              : 'Module submitted. The next module has started.'
          );
        }
      } catch (e) {
        setError(`Could not submit the module: ${errorMessage(e)}`);
      } finally {
        submittingRef.current = false;
        setSubmitting(false);
      }
    },
    [navigate]
  );

  // Auto-submit when the module timer runs out (also covers resuming after the deadline passed).
  useEffect(() => {
    if (expired && mod?.status === 'in_progress') void submit('expired');
  }, [expired, mod?.status, submit]);

  const change = useCallback(
    (patch: Partial<AnswerResponse>) => {
      if (!q || locked) return;
      saveResponse(updateResponse(q, patch));
    },
    [q, locked, updateResponse]
  );

  const goTo = useCallback(
    (index: number) => {
      if (index >= 0 && index < questions.length) setCurrentIndex(index);
    },
    [questions.length, setCurrentIndex]
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable) return;
      if (confirmOpen || e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === KEYBOARD_SHORTCUTS.PREV_QUESTION) goTo(currentIndex - 1);
      else if (e.key === KEYBOARD_SHORTCUTS.NEXT_QUESTION) goTo(currentIndex + 1);
      else if (e.key.toLowerCase() === KEYBOARD_SHORTCUTS.MARK_REVIEW) change({ markedForReview: !response?.markedForReview });
      else if (e.key.toLowerCase() === KEYBOARD_SHORTCUTS.TOGGLE_TIMER) toggleVisibility();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [confirmOpen, currentIndex, goTo, change, response?.markedForReview, toggleVisibility]);

  if (!attempt || !content) {
    return (
      <CenteredMessage title="No active test" text="Start a practice test from the library.">
        <Link to={ROUTES.PRACTICE} className="btn-primary">Open Practice Library</Link>
      </CenteredMessage>
    );
  }

  if (!mod) {
    return (
      <CenteredMessage title="Test complete" text="All modules have been submitted.">
        <Link to={paths.results(attempt.id)} className="btn-primary">View Results</Link>
      </CenteredMessage>
    );
  }

  const unansweredCount = questions.filter((qq) => !responses[qq.id]?.isAnswered).length;
  const reviewCount = questions.filter((qq) => responses[qq.id]?.markedForReview).length;
  const warning = remaining <= DEFAULT_TIMER_WARNING_SECONDS;

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <span className="px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium truncate">
            {section?.name ?? mod.sectionId} — Module {mod.module}
          </span>
          {section?.calculatorAllowed && <span className="text-xs text-slate-500">Calculator allowed</span>}
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-mono font-medium border ${
              expired
                ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400'
                : warning
                  ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-700 dark:text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
            }`}
            role="timer"
            aria-live={warning ? 'polite' : 'off'}
          >
            <Clock className="w-3.5 h-3.5" />
            {expired ? 'Time is up' : isVisible || warning ? formatClock(remaining) : 'Hidden'}
          </div>
          <button
            onClick={toggleVisibility}
            className="btn-ghost"
            aria-label={isVisible ? 'Hide timer' : 'Show timer'}
            title="Toggle timer (T)"
          >
            {isVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate(ROUTES.HOME)}
            className="btn-ghost"
            title="Leave the test (it keeps running — resume it from Home)"
          >
            <LogOut className="w-4 h-4 mr-1" /> Exit
          </button>
          <button onClick={() => setConfirmOpen(true)} className="btn-primary" disabled={submitting}>
            {submitting ? 'Submitting…' : 'Submit Module'}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Question navigator */}
        <aside className="hidden lg:flex lg:w-72 lg:flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 text-sm font-semibold">
            Questions <span className="font-normal text-slate-500">({questions.length - unansweredCount}/{questions.length} answered)</span>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {questions.map((mq, i) => {
              const status = getQuestionStatus(responses[mq.id]);
              const isCurrent = i === currentIndex;
              return (
                <button
                  key={mq.id}
                  onClick={() => goTo(i)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded text-sm text-left transition-colors ${
                    isCurrent
                      ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 border-l-2 border-brand-600'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                  aria-label={`Question ${mq.number}, ${STATUS_LABEL[status]}`}
                  aria-current={isCurrent ? 'step' : undefined}
                >
                  <span className="flex items-center gap-3 min-w-0">
                    <span className={`w-6 text-center font-mono ${isCurrent ? 'font-bold' : ''}`}>{mq.number}</span>
                    <span className="truncate">{mq.stem.replace(/\\[()[\]]/g, '')}</span>
                  </span>
                  <span className={`shrink-0 px-1.5 py-0.5 rounded text-[10px] font-semibold ${STATUS_BADGE[status]}`}>
                    {STATUS_LABEL[status]}
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Question body */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-10">
          <div className={`mx-auto space-y-4 ${passage ? 'max-w-6xl' : 'max-w-3xl'}`}>
            {notice && (
              <div className="flex items-start justify-between gap-3 rounded-md border border-brand-200 dark:border-brand-800 bg-brand-50 dark:bg-brand-900/20 px-4 py-3 text-sm text-brand-800 dark:text-brand-300">
                <span>{notice}</span>
                <button onClick={() => setNotice(null)} aria-label="Dismiss">
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
            <InlineError message={error} />

            {!q ? (
              <div className="exam-card p-8 text-center text-slate-500">This module has no questions.</div>
            ) : (
              <div className={passage ? 'grid grid-cols-1 xl:grid-cols-2 gap-6 items-start' : ''}>
                {passage && (
                  <section className="exam-card p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <BookOpen className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{passage.title}</span>
                    </div>
                    <p className="whitespace-pre-line leading-relaxed text-slate-700 dark:text-slate-300">
                      <RichText text={passage.content} />
                    </p>
                  </section>
                )}

                <section className="space-y-4">
                  <div className="exam-card p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                        Question {q.number} of {questions.length}
                      </span>
                      <button
                        onClick={() => change({ markedForReview: !response?.markedForReview })}
                        disabled={locked}
                        className={`btn-ghost text-xs ${response?.markedForReview ? 'text-amber-600 dark:text-amber-400' : ''}`}
                        title="Mark for review (R)"
                      >
                        <Flag className={`w-4 h-4 mr-1 ${response?.markedForReview ? 'fill-current' : ''}`} />
                        {response?.markedForReview ? 'Marked for review' : 'Mark for review'}
                      </button>
                    </div>
                    <p className="whitespace-pre-line break-words leading-relaxed">
                      <RichText text={q.stem} />
                    </p>
                    {q.image && (
                      <img
                        src={q.image}
                        alt=""
                        className="mt-4 max-w-full max-h-[300px] rounded-lg border border-slate-200 dark:border-slate-700 object-contain"
                      />
                    )}
                  </div>

                  <div className="exam-card p-6">
                    {isMultipleChoice(q) ? (
                      <div className="space-y-2" role="radiogroup" aria-label="Answer choices">
                        {q.options.map((opt) => {
                          const selected = response?.selectedOptionId === opt.id;
                          const eliminated = response?.eliminatedOptionIds.includes(opt.id) ?? false;
                          return (
                            <div key={opt.id} className="flex items-stretch gap-2">
                              <button
                                role="radio"
                                aria-checked={selected}
                                disabled={locked || eliminated}
                                onClick={() => change({ selectedOptionId: opt.id })}
                                className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
                                  selected
                                    ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 text-brand-800 dark:text-brand-300'
                                    : eliminated
                                      ? 'border-slate-200 dark:border-slate-700 text-slate-400 line-through'
                                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                                }`}
                              >
                                <span
                                  className={`w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-xs font-bold border ${
                                    selected ? 'bg-brand-600 border-brand-600 text-white' : 'border-slate-300 dark:border-slate-600'
                                  }`}
                                >
                                  {opt.label}
                                </span>
                                <RichText text={opt.content} />
                              </button>
                              <button
                                onClick={() => {
                                  const list = response?.eliminatedOptionIds ?? [];
                                  const next = eliminated ? list.filter((id) => id !== opt.id) : [...list, opt.id];
                                  change({
                                    eliminatedOptionIds: next,
                                    ...(selected && !eliminated ? { selectedOptionId: null } : {}),
                                  });
                                }}
                                disabled={locked}
                                className="btn-ghost px-2 text-xs"
                                aria-label={eliminated ? `Restore choice ${opt.label}` : `Eliminate choice ${opt.label}`}
                                title={eliminated ? 'Undo eliminate' : 'Eliminate'}
                              >
                                {eliminated ? 'Undo' : <span className="line-through">{opt.label}</span>}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div>
                        <label htmlFor="spr-answer" className="label-text">Your answer</label>
                        <div className="flex items-center gap-3">
                          <input
                            id="spr-answer"
                            type="text"
                            inputMode="decimal"
                            maxLength={6}
                            value={response?.numericAnswer ?? ''}
                            onChange={(e) => change({ numericAnswer: e.target.value.replace(/[^0-9./-]/g, '') || null })}
                            disabled={locked}
                            className="input-field w-40 font-mono"
                            placeholder="e.g. 3/4"
                          />
                          {q.unit && <span className="text-sm text-slate-500">{q.unit}</span>}
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          Enter a number, decimal or fraction (for example 12, 0.75 or 3/4). Negative values are allowed.
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              </div>
            )}

            <div className="flex items-center justify-between pt-2">
              <button onClick={() => goTo(currentIndex - 1)} disabled={currentIndex <= 0} className="btn-secondary">
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </button>
              <span className="text-sm text-slate-500">
                {currentIndex + 1} / {questions.length}
              </span>
              {currentIndex < questions.length - 1 ? (
                <button onClick={() => goTo(currentIndex + 1)} className="btn-secondary">
                  Next <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              ) : (
                <button onClick={() => setConfirmOpen(true)} className="btn-primary" disabled={submitting}>
                  Submit Module
                </button>
              )}
            </div>
          </div>
        </main>
      </div>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="submit-title"
        >
          <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h3 id="submit-title" className="text-lg font-semibold mb-2">Submit this module?</h3>
            <p className="text-slate-600 dark:text-slate-400 mb-2">
              You will not be able to change answers in this module after submitting.
            </p>
            {(unansweredCount > 0 || reviewCount > 0) && (
              <ul className="text-sm text-amber-700 dark:text-amber-400 mb-4 list-disc pl-5">
                {unansweredCount > 0 && <li>{unansweredCount} unanswered</li>}
                {reviewCount > 0 && <li>{reviewCount} marked for review</li>}
              </ul>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setConfirmOpen(false)} className="btn-secondary flex-1" autoFocus>
                Cancel
              </button>
              <button onClick={() => submit(expired ? 'expired' : 'submitted')} className="btn-primary flex-1">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CenteredMessage({ title, text, children }: { title: string; text: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center h-screen text-center p-6">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="text-slate-500 dark:text-slate-400 mb-4">{text}</p>
      {children}
    </div>
  );
}
