export type Theme = 'light' | 'dark';

export interface UserPreferences {
  theme: Theme;
  fontSize: 'small' | 'medium' | 'large';
  timerVisible: boolean;
  soundEnabled: boolean;
  keyboardShortcuts: boolean;
}

export type SectionType = 'reading_writing' | 'math';
export type QuestionType = 'multiple_choice' | 'student_produced_response' | 'reading_passage';

export interface SectionConfig {
  id: string;
  name: string;
  type: SectionType;
  module: number;
  questionCount: number;
  durationMinutes: number;
  calculatorAllowed: boolean;
  adaptiveRouting?: boolean;
}

export interface TestMetadata {
  id: string;
  title: string;
  description: string;
  version: string;
  total_questions?: number;
  /** Older test files keep the section list inside metadata. */
  sections?: SectionConfig[];
  adaptive?: boolean;
  createdAt?: number;
  updatedAt?: number;
}

export interface QuestionBase {
  id: string;
  sectionId: string;
  module: number;
  number: number;
  type: QuestionType;
  topic?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  points: number;
  stem: string;
  image?: string;
  explanation?: string;
  passageId?: string;
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
  /** Correct answer. Several accepted forms can be separated with "|", e.g. "1/2|0.5". */
  answer: string;
  unit?: string;
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
  text?: string;
}

export type Question =
  | MultipleChoiceQuestion
  | StudentProducedResponseQuestion
  | ReadingPassageQuestion;

export interface TestContent {
  metadata: TestMetadata;
  sections?: SectionConfig[];
  passages?: ReadingPassage[];
  questions: Question[];
}

export interface HighlightRange {
  id: string;
  questionId: string;
  start: number;
  end: number;
  style: 'yellow' | 'blue' | 'green';
}

export interface AnswerResponse {
  questionId: string;
  sectionId: string;
  module: number;
  questionNumber: number;
  type: QuestionType;
  selectedOptionId: string | null;
  numericAnswer: string | null;
  isAnswered: boolean;
  markedForReview: boolean;
  eliminatedOptionIds: string[];
  note: string | null;
  highlights: HighlightRange[];
  timeSpentSeconds: number;
  lastUpdated: number;
}

export interface ModuleScore {
  correct: number;
  incorrect: number;
  unanswered: number;
  total: number;
}

/** `pending` = not started yet; startedAt/deadlineAt are 0 until the module begins. */
export type ModuleStatus = 'pending' | 'in_progress' | 'completed' | 'expired';

export interface ModuleAttempt {
  id: string;
  sectionId: string;
  module: number;
  startedAt: number;
  completedAt: number | null;
  deadlineAt: number;
  durationMinutes: number;
  status: ModuleStatus;
  timeRemainingSeconds: number;
  responses: Record<string, AnswerResponse>;
  scores: ModuleScore | null;
}

export interface TestScore {
  /** null when the test has no section of that type */
  readingWritingScore: number | null;
  mathScore: number | null;
  totalScore: number;
  correct: number;
  incorrect: number;
  unanswered: number;
  accuracy: number;
  timeSpentSeconds: number;
}

export type AttemptStatus = 'in_progress' | 'completed';

export interface TestAttempt {
  id: string;
  testId: string;
  startedAt: number;
  completedAt: number | null;
  status: AttemptStatus;
  modules: Record<string, ModuleAttempt>;
  totalScore: TestScore | null;
}

export interface AttemptSummary {
  id: string;
  testId: string;
  testTitle: string;
  startedAt: number;
  completedAt: number | null;
  status: AttemptStatus;
  totalScore: TestScore | null;
}

export interface TestSummary {
  id: string;
  title: string;
  description: string;
  version: string;
  totalQuestions: number;
  createdAt: number;
  updatedAt: number;
}

export type IPCResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  requestId?: string;
  timestamp?: number;
};
