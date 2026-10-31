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
  EyeOff,
  MoreHorizontal,
  LayoutList,
} from 'lucide-react';
import { KaTeX } from 'react-katex';
import 'katex/dist/katex.min.css';
import { ROUTES } from '../../shared/constants';
import { useExamStore } from '../store/useExamStore';
import { useTimerStore } from '../store/useTimerStore';
import { useAppStore } from '../store/useAppStore';

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

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const currentQuestion = (() => {
    if (!content || currentSectionId == null || currentModule == null || currentQuestionNumber == null) return null;
    return content.questions.find(
      (q: Question) => q.sectionId === currentSectionId && q.module === currentModule && q.number === currentQuestionNumber
    );
  })();

  const currentResponse = responses[currentQuestion?.id ?? ''];

  const moduleQuestions = (() => {
    if (!content || currentSectionId == null || currentModule == null) return [];
    return content.questions.filter(
      (q: Question) => q.sectionId === currentSectionId && q.module === currentModule
    );
  })();

  const currentIndex = moduleQuestions.findIndex((q: Question) => q.id === currentQuestion?.id);
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
    setCurrentQuestion(next.sectionId, next.module, prev.number);
  }, [hasNext, moduleQuestions, currentIndex, setCurrentQuestion]);

  useEffect(() => {
    if (currentModule && !isExpired) {
      const now = Date.now();
      const deadline = now + durationMinutes * 60 * 1000;
      startTimer(durationMinutes, deadline);
    }
    return () => stopTimer();
  }, [currentModule, durationMinutes, isExpired, startTimer, stopTimer]);

  useEffect(() => {
    if (!currentModule) return;
    const interval = setInterval(() => {
      const now = Date.now();
      const attempt = moduleAttempts[`${currentSectionId}-m${currentModule}`];
      const deadline = attempt?.deadlineAt || now + durationMinutes * 60 * 1000;
      const remaining = Math.max(0, Math.floor((deadline - now) / 1000));
      updateRemaining(remaining);
    }, 1000);
    return () => clearInterval(interval);
  }, [currentModule, currentSectionId, durationMinutes, updateRemaining, moduleAttempts]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (typing) return;
      if (e.key === 'ArrowLeft') { goPrev(); }
      if (e.key === 'ArrowRight') { goNext(); }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [goPrev, goNext]);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (isLocked || !content || !currentSectionId || !currentModule || currentQuestionNumber == null) {
    return (
      <div className="flex flex-col items-center justify-center h-full">
        <div className="text-center">
          <X className="w-12 h-12 mx-auto mb-4 text-slate-400" />
          <h2 className="text-lg font-semibold">Module Complete</h2>
          <p className="text-slate-500 dark:text-slate-400">This module has been submitted.</p>
          <button onClick={() => navigate(ROUTES.RESULTS)} className="btn-primary mt-4">View Results</button>
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
          <h3 className="text-sm font-semibold">Questions</h3>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {moduleQuestions.map((mq: Question) => {
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
                          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}
                }
                aria-label="Question " + mq.number + ", " + status
              >
                <div className="flex items-center gap-3">
                  <span className={"w-6 text-center font-mono " + (isCurrent ? 'font-bold' : 'font-normal')}>
                    {mq.number}
                  </span>
                  <span className="truncate">{mq.stem.length > 40 ? mq.stem.slice(0, 40) + '…' : mq.stem}</span>
                </div>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    status === 'answered' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                    : status === 'review' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                    : status === 'answered-review' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}
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
              {content?.sections?.[currentSectionId]?.name} — Module {currentModule}
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
              }"}
            >
              {isVisible && !isExpired ? (
                <>
