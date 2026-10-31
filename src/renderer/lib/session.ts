import type { AnswerResponse, ModuleAttempt, TestAttempt, TestContent } from '@shared/types';
import { getModuleQuestions, getSections, moduleKey, scoreAttempt, scoreQuestions } from '@shared/exam';
import { invoke } from './api';
import { useExamStore } from '../store/useExamStore';

function startModule(m: ModuleAttempt, now = Date.now()): ModuleAttempt {
  return {
    ...m,
    status: 'in_progress',
    startedAt: now,
    deadlineAt: now + m.durationMinutes * 60_000,
    timeRemainingSeconds: m.durationMinutes * 60,
  };
}

/** Modules in test order (the order of the section list). */
export function orderedModules(attempt: TestAttempt, content: TestContent): ModuleAttempt[] {
  return getSections(content)
    .map((s) => attempt.modules[moduleKey(s.id, s.module)])
    .filter((m): m is ModuleAttempt => !!m);
}

async function persist(attempt: TestAttempt) {
  await invoke('db:save_attempt', { attempt });
}

export async function startAttempt(testId: string): Promise<string> {
  const content = await invoke<TestContent>('db:get_test', { testId });
  const sections = getSections(content);
  if (sections.length === 0) throw new Error('This test has no sections');

  const now = Date.now();
  const modules: Record<string, ModuleAttempt> = {};
  sections.forEach((s, i) => {
    const id = moduleKey(s.id, s.module);
    const base: ModuleAttempt = {
      id,
      sectionId: s.id,
      module: s.module,
      startedAt: 0,
      completedAt: null,
      deadlineAt: 0,
      durationMinutes: s.durationMinutes,
      status: 'pending',
      timeRemainingSeconds: s.durationMinutes * 60,
      responses: {},
      scores: null,
    };
    modules[id] = i === 0 ? startModule(base, now) : base;
  });

  const attempt: TestAttempt = {
    id: `attempt_${now}_${Math.random().toString(36).slice(2, 8)}`,
    testId,
    startedAt: now,
    completedAt: null,
    status: 'in_progress',
    modules,
    totalScore: null,
  };
  await persist(attempt);
  const first = sections[0]!;
  useExamStore.getState().loadSession(attempt, content, moduleKey(first.id, first.module));
  return attempt.id;
}

/** Loads an unfinished attempt into the exam store. Returns false if it is already completed. */
export async function resumeAttempt(attemptId: string): Promise<boolean> {
  const attempt = await invoke<TestAttempt | null>('db:get_attempt', { attemptId });
  if (!attempt) throw new Error('Attempt not found');
  if (attempt.status === 'completed') return false;
  const content = await invoke<TestContent>('db:get_test', { testId: attempt.testId });

  const modules = orderedModules(attempt, content);
  let current = modules.find((m) => m.status === 'in_progress');
  if (!current) {
    const next = modules.find((m) => m.status === 'pending');
    if (next) {
      current = startModule(next);
      attempt.modules[current.id] = current;
      await persist(attempt);
    }
  }
  useExamStore.getState().loadSession(attempt, content, current?.id ?? null);
  // If the module timer ran out while the app was closed, the exam page submits it on mount.
  return true;
}

export function saveResponse(response: AnswerResponse) {
  const { attempt } = useExamStore.getState();
  if (!attempt) return;
  invoke('db:save_response', {
    attemptId: attempt.id,
    moduleId: moduleKey(response.sectionId, response.module),
    response,
  }).catch((e) => console.error('Failed to save response', e));
}

export type SubmitResult = { finished: true; attemptId: string } | { finished: false; nextModuleId: string };

/** Closes the current module, then starts the next one or finishes and scores the whole attempt. */
export async function submitCurrentModule(reason: 'submitted' | 'expired'): Promise<SubmitResult> {
  const store = useExamStore.getState();
  const { attempt, content, currentModuleId } = store;
  if (!attempt || !content || !currentModuleId) throw new Error('No active module');
  const current = attempt.modules[currentModuleId];
  if (!current) throw new Error('No active module');

  const now = Date.now();
  const questions = getModuleQuestions(content, current.sectionId, current.module);
  const closed: ModuleAttempt = {
    ...current,
    status: reason === 'expired' ? 'expired' : 'completed',
    completedAt: reason === 'expired' ? Math.min(now, current.deadlineAt) : now,
    timeRemainingSeconds: Math.max(0, Math.round((current.deadlineAt - now) / 1000)),
    scores: scoreQuestions(questions, current.responses),
  };
  let next: TestAttempt = { ...attempt, modules: { ...attempt.modules, [closed.id]: closed } };

  const pending = orderedModules(next, content).find((m) => m.status === 'pending');
  if (pending) {
    const started = startModule(pending, now);
    next = { ...next, modules: { ...next.modules, [started.id]: started } };
    await persist(next);
    store.setAttempt(next);
    store.setCurrentModule(started.id);
    return { finished: false, nextModuleId: started.id };
  }

  next = { ...next, status: 'completed', completedAt: now };
  next.totalScore = scoreAttempt(content, next);
  await persist(next);
  store.setAttempt(next);
  store.setCurrentModule(null);
  return { finished: true, attemptId: next.id };
}
