// Shared application constants

export const APP_NAME = 'ExamDesk';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Digital SAT Practice Testing';

export const STORAGE_KEYS = {
  USER_PREFERENCES: 'user_preferences',
  LAST_ATTEMPT_ID: 'last_attempt_id',
} as const;

export const IPC_CHANNELS = {
  DB_GET_TESTS: 'db:get_tests',
  DB_GET_TEST: 'db:get_test',
  DB_IMPORT_TEST: 'db:import_test',
  DB_SAVE_ATTEMPT: 'db:save_attempt',
  DB_GET_ATTEMPT: 'db:get_attempt',
  DB_GET_ATTEMPTS: 'db:get_attempts',
  DB_SAVE_RESPONSE: 'db:save_response',
  APP_GET_VERSION: 'app:get_version',
} as const;

export const SECTION_TYPES = {
  READING_WRITING: 'reading_writing',
  MATH: 'math',
} as const;

export const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'multiple_choice',
  STUDENT_PRODUCED_RESPONSE: 'student_produced_response',
  READING_PASSAGE: 'reading_passage',
} as const;

export const DEFAULT_TIMER_WARNING_SECONDS = 300; // 5 minutes

export const ROUTES = {
  HOME: '/',
  PRACTICE: '/practice',
  TEST_SETUP: '/test-setup/:testId',
  EXAM: '/exam',
  RESULTS: '/results',
  RESULTS_DETAIL: '/results/:attemptId',
  REVIEW: '/review/:attemptId',
  SETTINGS: '/settings',
} as const;

export const paths = {
  testSetup: (testId: string) => `/test-setup/${encodeURIComponent(testId)}`,
  results: (attemptId: string) => `/results/${encodeURIComponent(attemptId)}`,
  review: (attemptId: string) => `/review/${encodeURIComponent(attemptId)}`,
};

export const KEYBOARD_SHORTCUTS = {
  NEXT_QUESTION: 'ArrowRight',
  PREV_QUESTION: 'ArrowLeft',
  MARK_REVIEW: 'r',
  TOGGLE_TIMER: 't',
} as const;
