export type Theme = 'light' | 'dark';

export interface UserPreferences {
  theme: Theme;
  fontSize: 'small' | 'medium' | 'large';
  timerVisible: boolean;
  soundEnabled: boolean;
  highContrast: boolean;
  keyboardShortcuts: boolean;
}

export interface TestMetadata {
  id: string;
  title: string;
  description: string;
  version: string;
  totalQuestions: number;
  sections: SectionConfig[];
  adaptive: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface SectionConfig {
  id: string;
  name: string;
  type: 'reading_writing' | 'math';
  module: number;
  questionCount: number;
  durationMinutes: number;
  calculatorAllowed: boolean;
  adaptiveRouting?: boolean;
}

export interface QuestionBase {
  id: string;
  sectionId: string;
  module: number;
  number: number;
  type: 'multiple_choice' | 'student_produced_response' | 'reading_passage';
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  points: number;
  stem: string;
  image?: string;
  explanation?: string;
}

export interface MultipleChoiceOption {
  id: string;
  label: 'A' | 'B' | 'C' | 'D';
  content: string;
  isCorrect: boolean;
}

export interface MultipleChoiceQuestion extends QuestionBase {
  type: 'multiple_choice';
  options: MultipleChoiceOption[];
}

export interface StudentProducedResponseQuestion extends QuestionBase {
  type: 'student_produced_response';
  answer: string;
  unit?: string;
  allowNegative?: boolean;
  allowDecimal?: boolean;
  maxDecimals?: number;
}

export interface ReadingPassageQuestion extends QuestionBase {
  type: 'reading_passage';
  passageId: string;
  options: MultipleChoiceOption[];
}

export interface ReadingPassage {
  id: string;
  title: string;
  content: string;
  text: string;
}

export type Question =
  | MultipleChoiceQuestion
  | StudentProducedResponseQuestion
  | ReadingPassageQuestion;

export interface TestContent {
  metadata: TestMetadata;
  sections: SectionConfig[];
  passages?: ReadingPassage[];
  questions: Question[];
}

export interface AnswerResponse {
  questionId: string;
  sectionId: string;
  module: number;
  questionNumber: number;
  type: 'multiple_choice' | 'student_produced_response' | 'reading_passage';
  selectedOptionId?: string | null;
  numericAnswer?: string | null;
  isAnswered: boolean;
  markedForReview: boolean;
  eliminatedOptionIds: string[];
  note?: string | null;
  highlights: HighlightRange[];
  timeSpentSeconds: number;
  lastUpdated: number;
}

export interface HighlightRange {
  id: string;
  questionId: string;
  start: number;
  end: number;
  style: 'yellow' | 'blue' | 'green';
}

export interface ModuleAttempt {
  id: string;
  testId: string;
  sectionId: string;
  module: number;
  startedAt: number;
  completedAt?: number;
  deadlineAt: number;
  durationMinutes: number;
  status: 'in_progress' | 'completed' | 'locked' | 'expired';
  timeRemainingSeconds: number;
  responses: Record<string, AnswerResponse>;
  scores?: ModuleScore;
}

export interface ModuleScore {
  correct: number;
  incorrect: number;
  unanswered: number;
  total: number;
  rawScore: number;
  scaledScore?: number;
}

export interface TestAttempt {
  id: string;
  testId: string;
  startedAt: number;
  completedAt?: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  modules: Record<string, ModuleAttempt>;
  totalScore?: TestScore;
}

export interface TestScore {
  readingWritingScore: number;
  mathScore: number;
  totalScore: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number;
  timeSpentSeconds: number;
}

export interface SessionState {
  attemptId: string | null;
  testId: string | null;
  currentSectionId: string | null;
  currentModule: number | null;
  currentQuestionNumber: number | null;
  isLocked: boolean;
}
export type IPCResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
  timestamp?: number;
};
