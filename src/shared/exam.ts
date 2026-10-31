// Pure exam helpers shared by the main and renderer processes (no DOM / Node APIs).
import type {
  AnswerResponse,
  ModuleAttempt,
  ModuleScore,
  MultipleChoiceQuestion,
  Question,
  ReadingPassageQuestion,
  SectionConfig,
  TestAttempt,
  TestContent,
  TestScore,
} from './types';

export type QuestionStatus = 'answered' | 'review' | 'answered-review' | 'unanswered';

export function getSections(content: TestContent): SectionConfig[] {
  return content.sections ?? content.metadata.sections ?? [];
}

export function moduleKey(sectionId: string, module: number): string {
  return `${sectionId}-m${module}`;
}

export function getModuleQuestions(content: TestContent, sectionId: string, module: number): Question[] {
  return content.questions
    .filter((q) => q.sectionId === sectionId && q.module === module)
    .sort((a, b) => a.number - b.number);
}

export function isMultipleChoice(q: Question): q is MultipleChoiceQuestion | ReadingPassageQuestion {
  return q.type !== 'student_produced_response';
}

export function getQuestionStatus(r: AnswerResponse | undefined): QuestionStatus {
  if (!r) return 'unanswered';
  if (r.markedForReview) return r.isAnswered ? 'answered-review' : 'review';
  return r.isAnswered ? 'answered' : 'unanswered';
}

/** Parses a student-produced response: integers, decimals and simple fractions ("3/4", "-1/2"). */
export function parseNumericAnswer(value: string): number | null {
  const s = value.trim().replace(/\s+/g, '');
  if (!s) return null;
  const frac = /^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(s);
  if (frac) {
    const den = Number(frac[2]);
    return den === 0 ? null : Number(frac[1]) / den;
  }
  if (!/^-?(\d+\.?\d*|\.\d+)$/.test(s)) return null;
  return Number(s);
}

export function isResponseCorrect(q: Question, r: AnswerResponse | undefined): boolean {
  if (!r || !r.isAnswered) return false;
  if (isMultipleChoice(q)) {
    return q.options.some((o) => o.id === r.selectedOptionId && o.isCorrect);
  }
  const given = parseNumericAnswer(r.numericAnswer ?? '');
  if (given === null) return false;
  return q.answer.split('|').some((accepted) => {
    const expected = parseNumericAnswer(accepted);
    return expected !== null && Math.abs(expected - given) < 1e-6;
  });
}

export function getCorrectAnswerText(q: Question): string {
  if (isMultipleChoice(q)) {
    const opt = q.options.find((o) => o.isCorrect);
    return opt ? opt.label : '—';
  }
  return q.answer.split('|').join(' or ');
}

export function scoreQuestions(questions: Question[], responses: Record<string, AnswerResponse>): ModuleScore {
  const score: ModuleScore = { correct: 0, incorrect: 0, unanswered: 0, total: questions.length };
  for (const q of questions) {
    const r = responses[q.id];
    if (!r || !r.isAnswered) score.unanswered++;
    else if (isResponseCorrect(q, r)) score.correct++;
    else score.incorrect++;
  }
  return score;
}

/** Linear practice estimate on the 200–800 scale, rounded to 10. Not an official SAT conversion. */
export function scaleSectionScore(correct: number, total: number): number {
  if (total <= 0) return 200;
  return Math.round((200 + (600 * correct) / total) / 10) * 10;
}

export function moduleTimeSpentSeconds(m: ModuleAttempt): number {
  if (!m.startedAt) return 0;
  const end = m.completedAt ?? Math.min(Date.now(), m.deadlineAt || Date.now());
  return Math.max(0, Math.round((end - m.startedAt) / 1000));
}

export function collectResponses(attempt: TestAttempt): Record<string, AnswerResponse> {
  const all: Record<string, AnswerResponse> = {};
  for (const m of Object.values(attempt.modules)) Object.assign(all, m.responses);
  return all;
}

export function scoreAttempt(content: TestContent, attempt: TestAttempt): TestScore {
  const responses = collectResponses(attempt);
  const sectionType = new Map(getSections(content).map((s) => [s.id, s.type]));
  const rwQuestions = content.questions.filter((q) => sectionType.get(q.sectionId) === 'reading_writing');
  const mathQuestions = content.questions.filter((q) => sectionType.get(q.sectionId) === 'math');

  const rw = scoreQuestions(rwQuestions, responses);
  const math = scoreQuestions(mathQuestions, responses);
  const all = scoreQuestions(content.questions, responses);

  const readingWritingScore = rw.total ? scaleSectionScore(rw.correct, rw.total) : null;
  const mathScore = math.total ? scaleSectionScore(math.correct, math.total) : null;

  return {
    readingWritingScore,
    mathScore,
    totalScore: (readingWritingScore ?? 0) + (mathScore ?? 0),
    correct: all.correct,
    incorrect: all.incorrect,
    unanswered: all.unanswered,
    accuracy: all.total ? Math.round((all.correct / all.total) * 100) : 0,
    timeSpentSeconds: Object.values(attempt.modules).reduce((sum, m) => sum + moduleTimeSpentSeconds(m), 0),
  };
}

/** Minimal structural validation for imported test files. Returns an error message or null. */
export function validateTestContent(value: unknown): string | null {
  if (!value || typeof value !== 'object') return 'File is not a JSON object';
  const c = value as Partial<TestContent>;
  if (!c.metadata || typeof c.metadata !== 'object') return 'Missing "metadata"';
  if (typeof c.metadata.title !== 'string' || !c.metadata.title) return 'Missing "metadata.title"';
  if (!Array.isArray(c.questions) || c.questions.length === 0) return 'Missing or empty "questions"';
  const sections = c.sections ?? c.metadata.sections;
  if (!Array.isArray(sections) || sections.length === 0) return 'Missing or empty "sections"';
  for (const s of sections) {
    if (typeof s?.id !== 'string' || typeof s?.module !== 'number' || typeof s?.durationMinutes !== 'number') {
      return 'Each section needs "id", "module" and "durationMinutes"';
    }
  }
  const ids = new Set<string>();
  for (const q of c.questions) {
    if (typeof q?.id !== 'string' || typeof q?.stem !== 'string') return 'Each question needs "id" and "stem"';
    if (ids.has(q.id)) return `Duplicate question id "${q.id}"`;
    ids.add(q.id);
    if (q.type === 'student_produced_response') {
      if (typeof q.answer !== 'string') return `Question "${q.id}" needs an "answer"`;
    } else if (!Array.isArray(q.options) || q.options.length === 0) {
      return `Question "${q.id}" needs "options"`;
    }
  }
  return null;
}
