import { create } from 'zustand';
import type { AnswerResponse, ModuleAttempt, Question, TestAttempt, TestContent } from '@shared/types';
import { collectResponses } from '@shared/exam';

type ExamStore = {
  attempt: TestAttempt | null;
  content: TestContent | null;
  /** id of the module currently being taken (key of attempt.modules) */
  currentModuleId: string | null;
  currentIndex: number;
  /** All responses of the attempt, keyed by question id */
  responses: Record<string, AnswerResponse>;

  loadSession: (attempt: TestAttempt, content: TestContent, currentModuleId: string | null) => void;
  setCurrentIndex: (index: number) => void;
  setCurrentModule: (moduleId: string | null) => void;
  updateModule: (module: ModuleAttempt) => void;
  setAttempt: (attempt: TestAttempt) => void;
  /** Applies a patch to a question's response (creating it if needed) and returns the new response. */
  updateResponse: (question: Question, patch: Partial<AnswerResponse>) => AnswerResponse;
  reset: () => void;
};

function emptyResponse(q: Question): AnswerResponse {
  return {
    questionId: q.id,
    sectionId: q.sectionId,
    module: q.module,
    questionNumber: q.number,
    type: q.type,
    selectedOptionId: null,
    numericAnswer: null,
    isAnswered: false,
    markedForReview: false,
    eliminatedOptionIds: [],
    note: null,
    highlights: [],
    timeSpentSeconds: 0,
    lastUpdated: Date.now(),
  };
}

const initialState = {
  attempt: null,
  content: null,
  currentModuleId: null,
  currentIndex: 0,
  responses: {},
};

export const useExamStore = create<ExamStore>()((set, get) => ({
  ...initialState,

  loadSession: (attempt, content, currentModuleId) =>
    set({ attempt, content, currentModuleId, currentIndex: 0, responses: collectResponses(attempt) }),

  setCurrentIndex: (currentIndex) => set({ currentIndex }),

  setCurrentModule: (currentModuleId) => set({ currentModuleId, currentIndex: 0 }),

  updateModule: (module) =>
    set((state) =>
      state.attempt
        ? { attempt: { ...state.attempt, modules: { ...state.attempt.modules, [module.id]: module } } }
        : {}
    ),

  setAttempt: (attempt) => set({ attempt }),

  updateResponse: (question, patch) => {
    const { responses, attempt, currentModuleId } = get();
    const merged: AnswerResponse = {
      ...(responses[question.id] ?? emptyResponse(question)),
      ...patch,
      lastUpdated: Date.now(),
    };
    merged.isAnswered =
      merged.selectedOptionId != null || (merged.numericAnswer != null && merged.numericAnswer.trim() !== '');

    const nextResponses = { ...responses, [question.id]: merged };
    let nextAttempt = attempt;
    const mod = currentModuleId ? attempt?.modules[currentModuleId] : undefined;
    if (attempt && mod) {
      nextAttempt = {
        ...attempt,
        modules: {
          ...attempt.modules,
          [mod.id]: { ...mod, responses: { ...mod.responses, [question.id]: merged } },
        },
      };
    }
    set({ responses: nextResponses, attempt: nextAttempt });
    return merged;
  },

  reset: () => set(initialState),
}));
