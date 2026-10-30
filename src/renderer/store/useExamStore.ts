import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type AnswerResponse = {
  questionId: string;
  sectionId: string;
  module: number;
  questionNumber: number;
  type: string;
  selectedOptionId: string | null;
  numericAnswer: string | null;
  isAnswered: boolean;
  markedForReview: boolean;
  eliminatedOptionIds: string[];
  highlights: any[];
  timeSpentSeconds: number;
  lastUpdated: number;
};

type ModuleAttempt = {
  id: string;
  testId: string;
  sectionId: string;
  module: number;
  startedAt: number;
  completedAt: number | null;
  deadlineAt: number;
  durationMinutes: number;
  status: string;
  timeRemainingSeconds: number;
  responses: Record<string, AnswerResponse>;
  scores: any;
};

type ExamStore = {
  content: any;
  metadata: any;
  sections: any[];
  currentSectionId: string | null;
  currentModule: number | null;
  currentQuestionNumber: number | null;
  responses: Record<string, AnswerResponse>;
  moduleAttempts: Record<string, ModuleAttempt>;
  isLocked: boolean;
  setContent: (content: any) => void;
  setCurrentQuestion: (sectionId: string, module: number, questionNumber: number) => void;
  setResponse: (response: AnswerResponse) => void;
  toggleReview: (questionId: string) => void;
  toggleEliminate: (questionId: string, optionId: string) => void;
  setNote: (questionId: string, note: string | null) => void;
  setHighlight: (questionId: string, ranges: any[]) => void;
  completeModule: (sectionId: string, module: number) => void;
  resetExam: () => void;
};

export const useExamStore = create<ExamStore>()(
  persist(
    (set) => ({
      content: null,
      metadata: null,
      sections: [],
      currentSectionId: null,
      currentModule: null,
      currentQuestionNumber: null,
      responses: {},
      moduleAttempts: {},
      isLocked: false,

      setContent: (content) => set({ content, sections: content?.sections ?? [] }),

      setCurrentQuestion: (sectionId, module, questionNumber) =>
        set({ currentSectionId: sectionId, currentModule: module, currentQuestionNumber: questionNumber }),

      setResponse: (response) => set({ responses: { ...state.responses, [response.questionId]: response } }),

      toggleReview: (questionId) =>
        set((state) => {
          const responses = { ...state.responses };
          const existing = responses[questionId];
          if (existing) {
            responses[questionId] = { ...existing, markedForReview: !existing.markedForReview };
          } else {
            responses[questionId] = { ...existing, markedForReview: true };
          }
          return { responses };
        }),

      toggleEliminate: (questionId, optionId) =>
        set((state) => {
          const responses = { ...state.responses };
          const existing = responses[questionId];
          if (!existing) return state;
          const eliminated = [...existing.eliminatedOptionIds];
          const idx = eliminated.indexOf(optionId);
          if (idx >= 0) eliminated.splice(idx, 1);
          else eliminated.push(optionId);
          responses[questionId] = { ...existing, eliminatedOptionIds: eliminated };
          return { responses };
        }),

      setNote: (questionId, note) =>
        set((state) => {
          const responses = { ...state.responses };
          const existing = responses[questionId];
          if (existing) {
            responses[questionId] = { ...existing, note };
          }
          return { responses };
        }),

      setHighlight: (questionId, ranges) =>
        set((state) => {
          const responses = { ...state.responses };
          const existing = responses[questionId];
          if (existing) {
            responses[questionId] = { ...existing, highlights: ranges };
          }
          return { responses };
        }),

      completeModule: (sectionId, module) =>
        set((state) => {
          const attempts = { ...state.moduleAttempts };
          const key = `${sectionId}-m${module}`;
          const attempt = attempts[key];
          if (attempt) {
            attempts[key] = { ...attempt, status: 'completed', completedAt: Date.now() };
          }
          return { moduleAttempts: attempts };
        }),

      resetExam: () =>
        set({
          content: null,
          metadata: null,
          sections: [],
          currentSectionId: null,
          currentModule: null,
          currentQuestionNumber: null,
          responses: {},
          moduleAttempts: {},
          isLocked: false,
        }),
    }),
    {
      name: 'examdesk-exam-store',
      storage: createJSONStorage(() => localStorage),
    }
  )
);
