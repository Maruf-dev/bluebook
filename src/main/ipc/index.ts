import { ipcMain, app, dialog, type IpcMainInvokeEvent } from 'electron';
import { readFile } from 'node:fs/promises';
import { getDb } from '../database/db';
import { makeResponse, requireObject, requireString } from '../security/ipc-validator';
import { getMainWindow } from '../window';
import { getSections, validateTestContent } from '../../shared/exam';
import type {
  AnswerResponse,
  AttemptStatus,
  AttemptSummary,
  ModuleAttempt,
  ModuleStatus,
  TestAttempt,
  TestContent,
  TestScore,
  TestSummary,
} from '../../shared/types';

type Handler = (payload: unknown, event: IpcMainInvokeEvent) => unknown | Promise<unknown>;

function handle(channel: string, fn: Handler) {
  ipcMain.handle(channel, async (event, payload: unknown) => {
    try {
      return makeResponse(true, await fn(payload, event));
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      console.error(`[ipc] ${channel} failed:`, message);
      return makeResponse(false, undefined, message);
    }
  });
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
  if (value == null) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

// ---------- row types ----------

interface TestRow {
  id: string;
  title: string;
  description: string;
  version: string;
  total_questions: number;
  content: string;
  created_at: number;
  updated_at: number;
}

interface AttemptRow {
  id: string;
  test_id: string;
  started_at: number;
  completed_at: number | null;
  status: AttemptStatus;
  total_score: string | null;
}

interface ModuleRow {
  id: string;
  section_id: string;
  module: number;
  started_at: number;
  completed_at: number | null;
  deadline_at: number;
  duration_minutes: number;
  status: ModuleStatus;
  time_remaining_seconds: number;
  scores: string | null;
}

interface ResponseRow {
  module_attempt_id: string;
  question_id: string;
  section_id: string;
  module: number;
  question_number: number;
  type: AnswerResponse['type'];
  selected_option_id: string | null;
  numeric_answer: string | null;
  is_answered: number;
  marked_for_review: number;
  eliminated_option_ids: string;
  note: string | null;
  highlights: string;
  time_spent_seconds: number;
  last_updated: number;
}

// ---------- persistence helpers ----------

const UPSERT_RESPONSE_SQL = `
  INSERT INTO responses (id, attempt_id, module_attempt_id, question_id, section_id, module, question_number, type,
    selected_option_id, numeric_answer, is_answered, marked_for_review, eliminated_option_ids, note, highlights,
    time_spent_seconds, last_updated)
  VALUES (@id, @attempt_id, @module_attempt_id, @question_id, @section_id, @module, @question_number, @type,
    @selected_option_id, @numeric_answer, @is_answered, @marked_for_review, @eliminated_option_ids, @note, @highlights,
    @time_spent_seconds, @last_updated)
  ON CONFLICT(id) DO UPDATE SET
    selected_option_id = excluded.selected_option_id,
    numeric_answer = excluded.numeric_answer,
    is_answered = excluded.is_answered,
    marked_for_review = excluded.marked_for_review,
    eliminated_option_ids = excluded.eliminated_option_ids,
    note = excluded.note,
    highlights = excluded.highlights,
    time_spent_seconds = excluded.time_spent_seconds,
    last_updated = excluded.last_updated`;

function upsertResponse(attemptId: string, moduleAttemptId: string, r: AnswerResponse) {
  getDb()
    .prepare(UPSERT_RESPONSE_SQL)
    .run({
      id: `${moduleAttemptId}-${r.questionId}`,
      attempt_id: attemptId,
      module_attempt_id: moduleAttemptId,
      question_id: requireString(r.questionId, 'questionId'),
      section_id: r.sectionId,
      module: r.module,
      question_number: r.questionNumber,
      type: r.type,
      selected_option_id: r.selectedOptionId ?? null,
      numeric_answer: r.numericAnswer ?? null,
      is_answered: r.isAnswered ? 1 : 0,
      marked_for_review: r.markedForReview ? 1 : 0,
      eliminated_option_ids: JSON.stringify(r.eliminatedOptionIds ?? []),
      note: r.note ?? null,
      highlights: JSON.stringify(r.highlights ?? []),
      time_spent_seconds: r.timeSpentSeconds ?? 0,
      last_updated: r.lastUpdated ?? Date.now(),
    });
}

function saveAttempt(attempt: TestAttempt) {
  const d = getDb();
  d.transaction(() => {
    d.prepare(
      `INSERT INTO attempts (id, test_id, started_at, completed_at, status, total_score)
       VALUES (@id, @test_id, @started_at, @completed_at, @status, @total_score)
       ON CONFLICT(id) DO UPDATE SET
         completed_at = excluded.completed_at,
         status = excluded.status,
         total_score = excluded.total_score`
    ).run({
      id: requireString(attempt.id, 'attempt.id'),
      test_id: requireString(attempt.testId, 'attempt.testId'),
      started_at: attempt.startedAt,
      completed_at: attempt.completedAt ?? null,
      status: attempt.status,
      total_score: attempt.totalScore ? JSON.stringify(attempt.totalScore) : null,
    });

    const upsertModule = d.prepare(
      `INSERT INTO module_attempts (id, attempt_id, section_id, module, started_at, completed_at, deadline_at,
         duration_minutes, status, time_remaining_seconds, scores)
       VALUES (@id, @attempt_id, @section_id, @module, @started_at, @completed_at, @deadline_at,
         @duration_minutes, @status, @time_remaining_seconds, @scores)
       ON CONFLICT(id) DO UPDATE SET
         started_at = excluded.started_at,
         completed_at = excluded.completed_at,
         deadline_at = excluded.deadline_at,
         status = excluded.status,
         time_remaining_seconds = excluded.time_remaining_seconds,
         scores = excluded.scores`
    );

    for (const m of Object.values(attempt.modules ?? {})) {
      // Module ids are only unique within an attempt, so prefix them with the attempt id.
      const rowId = `${attempt.id}:${m.id}`;
      upsertModule.run({
        id: rowId,
        attempt_id: attempt.id,
        section_id: m.sectionId,
        module: m.module,
        started_at: m.startedAt ?? 0,
        completed_at: m.completedAt ?? null,
        deadline_at: m.deadlineAt ?? 0,
        duration_minutes: m.durationMinutes,
        status: m.status,
        time_remaining_seconds: m.timeRemainingSeconds ?? 0,
        scores: m.scores ? JSON.stringify(m.scores) : null,
      });
      for (const r of Object.values(m.responses ?? {})) upsertResponse(attempt.id, rowId, r);
    }
  })();
}

function loadAttempt(attemptId: string): TestAttempt | null {
  const d = getDb();
  const row = (
    attemptId === 'latest'
      ? d
          .prepare("SELECT * FROM attempts WHERE status = 'completed' ORDER BY completed_at DESC LIMIT 1")
          .get()
      : d.prepare('SELECT * FROM attempts WHERE id = ?').get(attemptId)
  ) as AttemptRow | undefined;
  if (!row) return null;

  const moduleRows = d
    .prepare('SELECT * FROM module_attempts WHERE attempt_id = ? ORDER BY rowid')
    .all(row.id) as ModuleRow[];
  const responseRows = d.prepare('SELECT * FROM responses WHERE attempt_id = ?').all(row.id) as ResponseRow[];

  const modules: Record<string, ModuleAttempt> = {};
  const byRowId = new Map<string, ModuleAttempt>();
  for (const m of moduleRows) {
    const id = m.id.startsWith(`${row.id}:`) ? m.id.slice(row.id.length + 1) : m.id;
    const mod: ModuleAttempt = {
      id,
      sectionId: m.section_id,
      module: m.module,
      startedAt: m.started_at,
      completedAt: m.completed_at,
      deadlineAt: m.deadline_at,
      durationMinutes: m.duration_minutes,
      status: m.status,
      timeRemainingSeconds: m.time_remaining_seconds,
      responses: {},
      scores: parseJson(m.scores, null),
    };
    modules[id] = mod;
    byRowId.set(m.id, mod);
  }

  for (const r of responseRows) {
    const mod = byRowId.get(r.module_attempt_id);
    if (!mod) continue;
    mod.responses[r.question_id] = {
      questionId: r.question_id,
      sectionId: r.section_id,
      module: r.module,
      questionNumber: r.question_number,
      type: r.type,
      selectedOptionId: r.selected_option_id,
      numericAnswer: r.numeric_answer,
      isAnswered: r.is_answered === 1,
      markedForReview: r.marked_for_review === 1,
      eliminatedOptionIds: parseJson(r.eliminated_option_ids, []),
      note: r.note,
      highlights: parseJson(r.highlights, []),
      timeSpentSeconds: r.time_spent_seconds,
      lastUpdated: r.last_updated,
    };
  }

  return {
    id: row.id,
    testId: row.test_id,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    status: row.status,
    modules,
    totalScore: parseJson<TestScore | null>(row.total_score, null),
  };
}

function insertTest(content: TestContent): string {
  const d = getDb();
  const id = content.metadata.id || `test_${Date.now()}`;
  if (d.prepare('SELECT id FROM tests WHERE id = ?').get(id)) {
    throw new Error(`A test with id "${id}" is already imported`);
  }
  const normalized: TestContent = {
    ...content,
    metadata: { ...content.metadata, id },
    sections: getSections(content),
  };
  const now = Date.now();
  d.prepare(
    `INSERT INTO tests (id, title, description, version, total_questions, content, created_at, updated_at)
     VALUES (@id, @title, @description, @version, @total_questions, @content, @created_at, @updated_at)`
  ).run({
    id,
    title: content.metadata.title,
    description: content.metadata.description || '',
    version: content.metadata.version || '1.0.0',
    total_questions: content.questions.length,
    content: JSON.stringify(normalized),
    created_at: now,
    updated_at: now,
  });
  return id;
}

// ---------- handlers ----------

export function registerIpcHandlers() {
  handle('db:get_tests', (): TestSummary[] => {
    const rows = getDb()
      .prepare(
        'SELECT id, title, description, version, total_questions, created_at, updated_at FROM tests ORDER BY created_at'
      )
      .all() as Omit<TestRow, 'content'>[];
    return rows.map((r) => ({
      id: r.id,
      title: r.title,
      description: r.description,
      version: r.version,
      totalQuestions: r.total_questions,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  });

  handle('db:get_test', (payload): TestContent => {
    const testId = requireString(requireObject(payload, 'payload')['testId'], 'testId');
    const row = getDb().prepare('SELECT content FROM tests WHERE id = ?').get(testId) as
      | { content: string }
      | undefined;
    if (!row) throw new Error('Test not found');
    const content = parseJson<TestContent | null>(row.content, null);
    if (!content) throw new Error('Stored test content is corrupted');
    return content;
  });

  // Opens a file picker in the main process; the renderer never touches the file system.
  handle('db:import_test', async (): Promise<{ id: string } | null> => {
    const win = getMainWindow();
    const options = {
      title: 'Import practice test',
      filters: [{ name: 'Test files', extensions: ['json'] }],
      properties: ['openFile' as const],
    };
    const result = win ? await dialog.showOpenDialog(win, options) : await dialog.showOpenDialog(options);
    const filePath = result.filePaths[0];
    if (result.canceled || !filePath) return null;

    let parsed: unknown;
    try {
      parsed = JSON.parse(await readFile(filePath, 'utf8'));
    } catch {
      throw new Error('The selected file is not valid JSON');
    }
    const error = validateTestContent(parsed);
    if (error) throw new Error(`Invalid test file: ${error}`);
    return { id: insertTest(parsed as TestContent) };
  });

  handle('db:get_attempts', (): AttemptSummary[] => {
    const rows = getDb()
      .prepare(
        `SELECT a.*, COALESCE(t.title, 'Deleted test') AS test_title
         FROM attempts a LEFT JOIN tests t ON t.id = a.test_id
         ORDER BY a.started_at DESC`
      )
      .all() as Array<AttemptRow & { test_title: string }>;
    return rows.map((r) => ({
      id: r.id,
      testId: r.test_id,
      testTitle: r.test_title,
      startedAt: r.started_at,
      completedAt: r.completed_at,
      status: r.status,
      totalScore: parseJson<TestScore | null>(r.total_score, null),
    }));
  });

  handle('db:get_attempt', (payload): TestAttempt | null => {
    const attemptId = requireString(requireObject(payload, 'payload')['attemptId'], 'attemptId');
    return loadAttempt(attemptId);
  });

  handle('db:save_attempt', (payload) => {
    const attempt = requireObject(requireObject(payload, 'payload')['attempt'], 'attempt') as unknown as TestAttempt;
    saveAttempt(attempt);
    return { saved: true };
  });

  handle('db:save_response', (payload) => {
    const p = requireObject(payload, 'payload');
    const attemptId = requireString(p['attemptId'], 'attemptId');
    const moduleId = requireString(p['moduleId'], 'moduleId');
    const response = requireObject(p['response'], 'response') as unknown as AnswerResponse;
    upsertResponse(attemptId, `${attemptId}:${moduleId}`, response);
    return { saved: true };
  });

  handle('app:get_version', () => app.getVersion());
}
