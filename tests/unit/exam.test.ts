import { describe, expect, it } from 'vitest';
import type { AnswerResponse, Question, TestAttempt, TestContent } from '@shared/types';
import {
  getQuestionStatus,
  isResponseCorrect,
  moduleKey,
  parseNumericAnswer,
  scaleSectionScore,
  scoreAttempt,
  validateTestContent,
} from '@shared/exam';
import sample from '../../src/shared/content/sample-test.json';

const content = sample as unknown as TestContent;

function answer(q: Question, patch: Partial<AnswerResponse>): AnswerResponse {
  return {
    questionId: q.id,
    sectionId: q.sectionId,
    module: q.module,
    questionNumber: q.number,
    type: q.type,
    selectedOptionId: null,
    numericAnswer: null,
    isAnswered: true,
    markedForReview: false,
    eliminatedOptionIds: [],
    note: null,
    highlights: [],
    timeSpentSeconds: 0,
    lastUpdated: 0,
    ...patch,
  };
}

const q = (id: string) => content.questions.find((x) => x.id === id)!;

describe('parseNumericAnswer', () => {
  it.each([
    ['12', 12],
    [' -3 ', -3],
    ['0.75', 0.75],
    ['.5', 0.5],
    ['3/4', 0.75],
    ['-1/2', -0.5],
  ])('parses %s', (input, expected) => expect(parseNumericAnswer(input)).toBeCloseTo(expected));

  it.each(['', 'abc', '1/0', '1..2', '--1'])('rejects %j', (input) => expect(parseNumericAnswer(input)).toBeNull());
});

describe('isResponseCorrect', () => {
  it('checks multiple-choice answers against isCorrect', () => {
    expect(isResponseCorrect(q('q-math-1'), answer(q('q-math-1'), { selectedOptionId: 'q-math-1-b' }))).toBe(true);
    expect(isResponseCorrect(q('q-math-1'), answer(q('q-math-1'), { selectedOptionId: 'q-math-1-a' }))).toBe(false);
  });

  it('accepts equivalent numeric forms', () => {
    const spr = q('q-math-2'); // answer "60"
    expect(isResponseCorrect(spr, answer(spr, { numericAnswer: '60' }))).toBe(true);
    expect(isResponseCorrect(spr, answer(spr, { numericAnswer: '120/2' }))).toBe(true);
    expect(isResponseCorrect(spr, answer(spr, { numericAnswer: '61' }))).toBe(false);
  });

  it('treats missing or unanswered responses as not correct', () => {
    expect(isResponseCorrect(q('q-math-1'), undefined)).toBe(false);
    expect(isResponseCorrect(q('q-math-1'), answer(q('q-math-1'), { selectedOptionId: 'q-math-1-b', isAnswered: false }))).toBe(false);
  });
});

describe('sample test content', () => {
  it('is valid and every multiple-choice question has exactly one correct option', () => {
    expect(validateTestContent(content)).toBeNull();
    for (const question of content.questions) {
      if (question.type !== 'student_produced_response') {
        expect(question.options.filter((o) => o.isCorrect), question.id).toHaveLength(1);
      }
    }
  });
});

describe('scoreAttempt', () => {
  it('scores each section and sums the total', () => {
    const responses: Record<string, AnswerResponse> = {
      'q-rw-1': answer(q('q-rw-1'), { selectedOptionId: 'q-rw-1-b' }), // correct
      'q-rw-2': answer(q('q-rw-2'), { selectedOptionId: 'q-rw-2-a' }), // wrong
      'q-math-1': answer(q('q-math-1'), { selectedOptionId: 'q-math-1-b' }), // correct
      'q-math-2': answer(q('q-math-2'), { numericAnswer: '60' }), // correct
    };
    const rwId = moduleKey('rw-1', 1);
    const attempt: TestAttempt = {
      id: 'a1',
      testId: content.metadata.id,
      startedAt: 0,
      completedAt: 1,
      status: 'completed',
      totalScore: null,
      modules: {
        [rwId]: {
          id: rwId, sectionId: 'rw-1', module: 1, startedAt: 1_000, completedAt: 61_000, deadlineAt: 2_000_000,
          durationMinutes: 32, status: 'completed', timeRemainingSeconds: 0, scores: null,
          responses: { 'q-rw-1': responses['q-rw-1']!, 'q-rw-2': responses['q-rw-2']! },
        },
        'math-1-m1': {
          id: 'math-1-m1', sectionId: 'math-1', module: 1, startedAt: 61_000, completedAt: 91_000, deadlineAt: 2_000_000,
          durationMinutes: 35, status: 'completed', timeRemainingSeconds: 0, scores: null,
          responses: { 'q-math-1': responses['q-math-1']!, 'q-math-2': responses['q-math-2']! },
        },
      },
    };

    const score = scoreAttempt(content, attempt);
    expect(score.correct).toBe(3);
    expect(score.incorrect).toBe(1);
    expect(score.unanswered).toBe(4);
    expect(score.readingWritingScore).toBe(scaleSectionScore(1, 4));
    expect(score.mathScore).toBe(scaleSectionScore(2, 4));
    expect(score.totalScore).toBe(score.readingWritingScore! + score.mathScore!);
    expect(score.timeSpentSeconds).toBe(90);
  });

  it('scales to the 200–800 range', () => {
    expect(scaleSectionScore(0, 10)).toBe(200);
    expect(scaleSectionScore(10, 10)).toBe(800);
    expect(scaleSectionScore(5, 10)).toBe(500);
  });
});

describe('getQuestionStatus', () => {
  it('combines answered and review flags', () => {
    const base = answer(q('q-rw-1'), {});
    expect(getQuestionStatus(undefined)).toBe('unanswered');
    expect(getQuestionStatus({ ...base, isAnswered: true })).toBe('answered');
    expect(getQuestionStatus({ ...base, isAnswered: false, markedForReview: true })).toBe('review');
    expect(getQuestionStatus({ ...base, isAnswered: true, markedForReview: true })).toBe('answered-review');
  });
});

describe('validateTestContent', () => {
  it('reports structural problems', () => {
    expect(validateTestContent(null)).toMatch(/object/);
    expect(validateTestContent({ metadata: { title: 'x' }, questions: [] })).toMatch(/questions/);
    expect(
      validateTestContent({
        metadata: { title: 'x' },
        sections: [{ id: 's', module: 1, durationMinutes: 10 }],
        questions: [{ id: 'a', stem: 's', type: 'multiple_choice' }],
      })
    ).toMatch(/options/);
  });
});
