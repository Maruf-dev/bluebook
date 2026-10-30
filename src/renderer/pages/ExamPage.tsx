import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  X,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Calculator as CalcIcon,
  BookOpen,
  Flag,
  Clock,
  Eye,
  MoreHorizontal,
  LayoutList,
} from 'lucide-react';
import { KaTeX } from 'react-katex';
import 'katex/dist/katex.min.css';
import { ROUTES } from '../../shared/constants';
import { useExamStore } from '../store/useExamStore';
import { useTimerStore } from '../store/useTimerStore';
import { useAppStore } from '../store/useAppStore';
import { KaTeX as KaTeXComponent } from 'react-katex';

type Question = any;

function renderStem(stem: string) {
  return (
    <div className="prose prose-slate max-w-none dark:prose-invert text-slate-900 dark:text-slate-100 leading-relaxed">
      {stem}
    </div>
  );
}

export function ExamPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { theme } = useAppStore();
  const {
    content,
    sections,
    currentSectionId,
    currentModule,
    currentQuestionNumber,
    responses,
    setCurrentQuestion,
    setResponse,
    toggleReview,
    toggleEliminate,
    setNote,
    setHighlight,
    moduleAttempts,
    completeModule,
    isLocked,
  } = useExamStore();
  const {
    timeRemainingSeconds,
    isExpired,
    isVisible,
    startTimer,
    stopTimer,
    resetTimer,
    toggleVisibility,
    updateRemaining,
    durationMinutes,
  } = useTimerStore();

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Derive current question
  const currentQuestion = (() => {
    if (!content || currentSectionId == null || currentModule == null || currentQuestionNumber == null)
      return null;
    return content.questions.find(
      (q: Question) =>
        q.sectionId === currentSectionId && q.module === currentModule && q.number === currentQuestionNumber
    );
  })();

  const currentResponse = responses[currentQuestion?.id ?? ''];

  // Module questions
  const moduleQuestions = (() => {
    if (!content || currentSectionId == null || currentModule == null) return [];
    return content.questions.filter(
      (q: Question) => q.sectionId === currentSectionId && q.module === currentModule
    );
  })();

  const currentIndex = moduleQuestions.findIndex((q) => q.id === currentQuestion?.id);
  const hasPrev = currentIndex > 0;
  const hasNext = currentIndex < moduleQuestions.length - 1;

  const goToQuestion = useCallback(
    (q: Question) => {
      setCurrentQuestion(q.sectionId, q.module, q.number);
    },
    [setCurrentQuestion]
  );

  const goPrev = useCallback(() => {
    if (!hasPrev) return;
    const prev = moduleQuestions[currentIndex - 1];
    setCurrentQuestion(prev.sectionId, prev.module, prev.number);
  }, [hasPrev, moduleQuestions, currentIndex, setCurrentQuestion]);

  const goNext = useCallback(() => {
    if (!hasNext) return;
    const next = moduleQuestions[currentIndex + 1];
    setCurrentQuestion(next.sectionId, next.module, next.number);
  }, [hasNext, moduleQuestions, currentIndex, setCurrentQuestion]);

  // Timer effect - deadline based
  useEffect(() => {
    if (currentModule && !isExpired) {
      const now = Date.now();
      const deadline = now + durationMinutes * 60 * 1000;
      startTimer(durationMinutes, deadline);
    }
    return () => stopTimer();
  }, [currentModule, durationMinutes, isExpired, startTimer, stopTimer]);

  // Sync deadline-based remaining time
  useEffect(() => {
    if (!currentModule) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const attempt = moduleAttempts[`${currentSectionId}-m${currentModule}`];
      const deadline = attempt?.deadlineAt || now + durationMinutes * 60 * 1000;
      const remaining = Math.max(0, Math.floor((deadline - now) / 1000));
      updateRemaining(remaining);
      if (remaining <= 0 && !isExpired) {
        // auto-submit logic
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [currentModule, currentSectionId, durationMinutes, updateRemaining, isExpired, moduleAttempts]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (typing) return;
      if (e.key === 'ArrowLeft') { e.preventDefault(); goPrev(); }
      if (e.key === 'ArrowRight') { e.preventDefault(); goNext(); }
      if (e.key === 'r') { e.preventDefault(); toggleReview(currentQuestion?.id ?? ''); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goPrev, goNext, toggleReview, currentQuestion?.id]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Question status color
  const statusColor = (q: Question) => {
    const r = responses[q.id];
    if (!r) return 'text-slate-400';
    if (r.markedForReview && r.isAnswered) return 'text-amber-600 dark:text-amber-400';
    if (r.markedForReview) return 'text-amber-600 dark:text-amber-400';
    if (r.isAnswered) return 'text-green-600 dark:text-green-400';
    return 'text-slate-400';
  };

  // Answer handlers
  const handleSelectOption = (optionId: string) => {
    const q = currentQuestion as Question;
    if (!q) return;
    const isMC = q.type === 'multiple_choice' || q.type === 'reading_passage';
    const resp: any = {
      questionId: q.id,
      sectionId: q.sectionId,
      module: q.module,
      questionNumber: q.number,
      type: q.type,
      selectedOptionId: isMC ? optionId : currentResponse?.selectedOptionId ?? null,
      numericAnswer: isMC ? currentResponse?.numericAnswer ?? null : null,
      isAnswered: true,
      markedForReview: currentResponse?.markedForReview ?? false,
      eliminatedOptionIds: currentResponse?.eliminatedOptionIds ?? [],
      highlights: currentResponse?.highlights ?? [],
      timeSpentSeconds: currentResponse?.timeSpentSeconds ?? 0,
      lastUpdated: Date.now(),
    };
    setResponse(resp);
  };

  const handleNumericChange = (value: string) => {
    const q = currentQuestion as Question;
    if (!q) return;
    const resp: any = {
      questionId: q.id,
      sectionId: q.sectionId,
      module: q.module,
      questionNumber: q.number,
      type: q.type,
      selectedOptionId: null,
      numericAnswer: value === '' ? null : value,
      isAnswered: value !== '',
      markedForReview: currentResponse?.markedForReview ?? false,
      eliminatedOptionIds: currentResponse?.eliminatedOptionIds ?? [],
      highlights: currentResponse?.highlights ?? [],
      timeSpentSeconds: currentResponse?.timeSpentSeconds ?? 0,
      lastUpdated: Date.now(),
    };
    setResponse(resp);
  };

  const handleSubmitModule = () => {
    setSubmitConfirm(true);
  };

  const handleConfirmSubmit = () => {
    completeModule(currentSectionId!, currentModule!);
    navigate(ROUTES.RESULTS);
    setSubmitConfirm(false);
  };

  if (isLocked || !content || !currentSectionId || !currentModule || currentQuestionNumber == null) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <X className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <h2 className="text-lg font-semibold">Module Complete</h2>
          <p className="text-slate-500 dark:text-slate-400">This module has been submitted.</p>
          <button onClick={() => navigate(ROUTES.RESULTS)} className="btn-primary mt-4">
            View Results
          </button>
        </div>
      </div>
    );
  }

  const q = currentQuestion as Question;
  const isMC = q.type === 'multiple_choice' || q.type === 'reading_passage';
  const options: any[] = isMC ? (q.options || []) : [];
  const selectedId = currentResponse?.selectedOptionId ?? null;
  const eliminated = currentResponse?.eliminatedOptionIds ?? [];

  return (
    <div className="flex h-full overflow-hidden">
      <aside className="hidden lg:w-72 lg:flex lg:flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 z-20">
        <div className="p-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold">Questions</h3>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {moduleQuestions.map((mq) => {
            const r = responses[mq.id];
            const isCurrent = mq.id === q.id;
            const status = r
              ? r.markedForReview && r.isAnswered
                ? 'answered-review'
                : r.markedForReview
                  ? 'review'
                  : r.isAnswered
                    ? 'answered'
                    : 'unanswered'
                : 'unanswered';
            return (
              <button
                key={mq.id}
                onClick={() => goToQuestion(mq)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded text-sm transition-colors ${
                  isCurrent
                    ? 'bg-brand-50 dark:bg-brand-900/30 text-brand-700 dark:text-brand-400 border-l-2 border-brand-600'
                    : status === 'answered'
                      ? 'bg-green-50 dark:bg-green-900/10 text-green-700 dark:text-green-400'
                      : status === 'review'
                        ? 'bg-amber-50 dark:bg-amber-900/10 text-amber-700 dark:text-amber-400'
                        : status === 'answered-review'
                          ? 'bg-amber-50/50 dark:bg-amber-900/10 border-l-2 border-amber-500'
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                aria-label={`Question ${mq.number}, ${status}`}
              >
                <div className="flex items-center gap-3">
                  <span className={`w-6 text-center font-mono ${isCurrent ? 'font-bold' : 'font-normal'}`}>
                    {mq.number}
                  </span>
                  <span className="truncate">{mq.stem.length > 40 ? mq.stem.slice(0, 40) + '…' : mq.stem}</span>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    status === 'answered' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : status === 'review' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    : status === 'answered-review' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1).replace('-', ' ')}
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-6 z-10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs font-medium">
              {currentSection?.name} — Module {currentModule}
            </div>
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Question {currentQuestionNumber} of {moduleQuestions.length}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`px-3 py-1.5 rounded-md text-sm font-medium border ${
                isExpired
                  ? 'bg-red-50 dark:bg-red-900/20 border-red-500 text-red-700 dark:text-red-400'
                  : timeRemainingSeconds <= 300
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-500 text-amber-700 dark:text-amber-400'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              {isVisible && !isExpired ? (
                <>
                  <Clock className="w-3 h-3 mr-1" /> {formatTime(timeRemainingSeconds)}
                </>
              ) : isExpired ? (
                'Time expired'
              ) : (
                'Timer hidden'
              )}
            </div>

            <button onClick={toggleVisibility} className="btn-ghost" aria-label="Toggle timer visibility">
              <Eye className="w-4 h-4" />
            </button>
            <button onClick={() => setOpenMenu(!openMenu)} className="btn-ghost" aria-label="Question menu">
              <LayoutList className="w-4 h-4" />
            </button>
            <button onClick={() => setSubmitConfirm(true)} className="btn-ghost" aria-label="Submit module">
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 lg:p-12">
          <div className="max-w-4xl mx-auto">
            <div className="mb-8">
              <div className="exam-card p-6 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xs font-semibold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                    Question {q.number}
                  </span>
                  {q.difficulty && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold border text-slate-500 border-slate-200">
                      {q.difficulty}
                    </span>
                  )}
                </div>
                <div className="whitespace-pre-line break-words">{renderStem(q.stem)}</div>
              </div>

              {q.passage && (
                <div className="exam-card p-6 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <BookOpen className="w-4 h-4 text-slate-400" />
                    <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Passage</span>
                  </div>
                  <div className="whitespace-pre-line break-words text-slate-700 dark:text-slate-300 leading-relaxed">
                    {q.passage}
                  </div>
                </div>
              )}

              {q.image && (
                <div className="flex justify-center mb-6">
                  <img
                    src={q.image}
                    alt="Question image"
                    className="max-w-full max-h-[300px] rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 object-contain"
                  />
                </div>
              )}
            </div>

            <div className="exam-card p-6">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-4">Answer</h3>

              {isMC && options.length > 0 ? (
                <div className="space-y-2">
                  {options.map((opt) => {
                    const isSelected = selectedId === opt.id;
                    const isEliminated = eliminated.includes(opt.id);
                    return (
                      <button
                        key={opt.id}
                        onClick={() => {
                          if (isEliminated) return;
                          handleSelectOption(opt.id);
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border text-left transition-all ${
                          isSelected
                            ? 'bg-brand-50 dark:bg-brand-900/20 border-brand-500 text-brand-700 dark:text-brand-400'
                            : isEliminated
                              ? 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 opacity-60'
                              : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold border-slate-300 dark:border-slate-600">
                            {opt.label}
                          </span>
                          <span className="flex-1">{opt.content}</span>
                          {isSelected && <X className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <input
                    type="text"
                    value={currentResponse?.numericAnswer ?? ''}
                    onChange={(e) => handleNumericChange(e.target.value)}
                    className="input-field w-48"
                    placeholder="Enter your answer"
                    aria-label="Numeric answer"
                  />
                  {q.unit && <span className="text-slate-500 mt-1 text-xs">{q.unit}</span>}
                  <p className="text-xs text-slate-500 mt-2">
                    Enter a numeric value. Decimals and negative signs allowed where applicable.
                  </p>
                </div>
              )}

              <div className="mt-4 flex items-center gap-2">
                <button
                  onClick={() => toggleEliminate(q.id, 'placeholder')}
                  disabled={!isMC}
                  className="btn-ghost text-xs opacity-50"
                  aria-label="Eliminate option"
                >
                  Eliminate
                </button>
                <button onClick={() => toggleReview(q.id)} className="btn-ghost">
                  <Flag className="w-4 h-4" /> {currentResponse?.markedForReview ? 'Unmark Review' : 'Mark for Review'}
                </button>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-between">
              <button
                onClick={goPrev}
                disabled={!hasPrev || isExpired}
                className="btn-secondary disabled:opacity-50 disabled:pointer-events-none"
              >
                <ChevronLeft className="w-4 h-4 mr-2" /> Previous
              </button>

              <button
                onClick={goNext}
                disabled={!hasNext || isExpired}
                className="btn-secondary disabled:opacity-50 disabled:pointer-events-none"
              >
                Next <ChevronRight className="w-4 h-4 ml-2" />
              </button>

              <button
                onClick={handleSubmitModule}
                className="btn-primary"
                disabled={isExpired}
              >
                {isExpired ? 'Time Expired' : 'Submit Module'}
              </button>
            </div>
          </div>
        </div>

        {/* Submit confirmation modal */}
        {submitConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-lg p-6 max-w-sm w-full">
              <h3 className="text-lg font-semibold mb-2">Submit Module?</h3>
              <p className="text-slate-600 dark:text-slate-400 mb-6">
                You will not be able to change answers for this module after submitting.
              </p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setSubmitConfirm(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button onClick={handleConfirmSubmit} className="btn-primary flex-1">
                  Submit Module
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
