import type { HighlightRange } from '@shared/types';
import type {
  TestContent,
  TestMetadata,
  SectionConfig,
  ModuleAttempt,
  TestScore,
  UserPreferences,
  Theme,
} from '@shared/types';

export interface AppState {
  theme: Theme;
  userPreferences: UserPreferences;
  isOnline: boolean;
  setTheme: (theme: Theme) => void;
  setUserPreferences: (prefs: Partial<UserPreferences>) => void;
}

export interface ExamState {
  content: TestContent | null;
  metadata: TestMetadata | null;
  sections: SectionConfig[];
  currentSectionId: string | null;
  currentModule: number | null;
  currentQuestionNumber: number | null;
  responses: Record<string, any>;
  moduleAttempts: Record<string, ModuleAttempt>;
  isLocked: boolean;
  setContent: (content: TestContent | null) => void;
  setCurrentQuestion: (sectionId: string, module: number, questionNumber: number) => void;
  setResponse: (response: any) => void;
  toggleReview: (questionId: string) => void;
  toggleEliminate: (questionId: string, optionId: string) => void;
  setNote: (questionId: string, note: string | null) => void;
  setHighlight: (questionId: string, ranges: HighlightRange[]) => void;
  completeModule: (sectionId: string, module: number) => void;
  resetExam: () => void;
}

export interface TimerState {
  durationMinutes: number;
  timeRemainingSeconds: number;
  deadlineAt: number | null;
  startedAt: number | null;
  isRunning: boolean;
  isExpired: boolean;
  isVisible: boolean;
  warningSeconds: number;
  startTimer: (durationMinutes: number, deadlineAt: number) => void;
  stopTimer: () => void;
  resetTimer: () => void;
  toggleVisibility: () => void;
  updateRemaining: (seconds: number) => void;
}
