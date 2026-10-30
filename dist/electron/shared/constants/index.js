"use strict";
// Shared application constants
Object.defineProperty(exports, "__esModule", { value: true });
exports.KEYBOARD_SHORTCUTS = exports.ROUTES = exports.DEFAULT_TIMER_WARNING_SECONDS = exports.MODULE_STATUS = exports.QUESTION_TYPES = exports.SECTION_TYPES = exports.IPC_CHANNELS = exports.STORAGE_KEYS = exports.APP_DESCRIPTION = exports.APP_VERSION = exports.APP_NAME = void 0;
exports.APP_NAME = 'ExamDesk';
exports.APP_VERSION = '1.0.0';
exports.APP_DESCRIPTION = 'Digital SAT Practice Testing';
exports.STORAGE_KEYS = {
    USER_PREFERENCES: 'user_preferences',
    LAST_ATTEMPT_ID: 'last_attempt_id',
};
exports.IPC_CHANNELS = {
    // Database / data
    DB_INIT: 'db:init',
    DB_GET_TESTS: 'db:get_tests',
    DB_GET_TEST: 'db:get_test',
    DB_SAVE_ATTEMPT: 'db:save_attempt',
    DB_GET_ATTEMPT: 'db:get_attempt',
    DB_GET_ATTEMPTS: 'db:get_attempts',
    DB_SAVE_RESPONSE: 'db:save_response',
    DB_IMPORT_TEST: 'db:import_test',
    // Window
    WINDOW_MINIMIZE: 'window:minimize',
    WINDOW_MAXIMIZE: 'window:maximize',
    WINDOW_CLOSE: 'window:close',
    // App
    APP_GET_VERSION: 'app:get_version',
    APP_GET_PATH: 'app:get_path',
};
exports.SECTION_TYPES = {
    READING_WRITING: 'reading_writing',
    MATH: 'math',
};
exports.QUESTION_TYPES = {
    MULTIPLE_CHOICE: 'multiple_choice',
    STUDENT_PRODUCED_RESPONSE: 'student_produced_response',
    READING_PASSAGE: 'reading_passage',
};
exports.MODULE_STATUS = {
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    LOCKED: 'locked',
    EXPIRED: 'expired',
};
exports.DEFAULT_TIMER_WARNING_SECONDS = 300; // 5 minutes
exports.ROUTES = {
    HOME: '/',
    PRACTICE: '/practice',
    TEST_SETUP: '/test-setup/:testId',
    EXAM: '/exam',
    RESULTS: '/results',
    REVIEW: '/review/:attemptId',
    SETTINGS: '/settings',
};
exports.KEYBOARD_SHORTCUTS = {
    NEXT_QUESTION: 'ArrowRight',
    PREV_QUESTION: 'ArrowLeft',
    MARK_REVIEW: 'r',
    CALCULATOR: 'c',
    REFERENCE: 'f',
    HELP: 'h',
    TOGGLE_TIMER: 't',
    FLAG_ELIMINATE: 'e',
    SUBMIT: 'Enter',
};
