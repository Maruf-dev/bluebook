import { ipcMain, app } from 'electron';
import { initDatabase, closeDatabase, type DB } from '../database/db';
import { makeResponse } from '../security/ipc-validator';
import { registerWindowIpcHandlers } from '../window';

let db: DB | null = null;

function requireDb(): DB {
  if (!db) throw new Error('Database not initialized');
  return db;
}

export function registerIpcHandlers() {
  ipcMain.handle('db:init', async () => {
    db = initDatabase();
    return makeResponse(undefined, true, { initialized: true });
  });

  ipcMain.handle('db:get_tests', async () => {
    try {
      const d = requireDb();
      const rows = d
        .prepare('SELECT id, title, description, version, total_questions, created_at, updated_at FROM tests')
        .all() as Array<{
          id: string;
          title: string;
          description: string;
          version: string;
          total_questions: number;
          created_at: number;
          updated_at: number;
        }>;
      return makeResponse(undefined, true, rows);
    } catch (e: any) {
      return makeResponse(undefined, false, undefined, e.message);
    }
  });

  ipcMain.handle('db:get_test', async (_event, { testId }: { testId: string }) => {
    try {
      const d = requireDb();
      const row = d
        .prepare('SELECT * FROM tests WHERE id = ?')
        .get(testId) as { content: string } | undefined;
      if (!row) return makeResponse(undefined, false, undefined, 'Test not found');
      try {
        const content = JSON.parse(row.content);
        return makeResponse(undefined, true, content);
      } catch {
        return makeResponse(undefined, false, undefined, 'Invalid test content');
      }
    } catch (e: any) {
      return makeResponse(undefined, false, undefined, e.message);
    }
  });

  ipcMain.handle('db:get_attempts', async () => {
    try {
      const d = requireDb();
      const rows = d
        .prepare('SELECT * FROM attempts ORDER BY started_at DESC')
        .all() as Array<{
          id: string;
          test_id: string;
          started_at: number;
          completed_at?: number;
          status: string;
          total_score?: string;
        }>;
      return makeResponse(undefined, true, rows);
    } catch (e: any) {
      return makeResponse(undefined, false, undefined, e.message);
    }
  });

  ipcMain.handle('db:get_attempt', async (_event, { attemptId }: { attemptId: string }) => {
    try {
      const d = requireDb();
      const attempt = d
        .prepare('SELECT * FROM attempts WHERE id = ?')
        .get(attemptId) as { id: string; test_id: string; modules?: string } | undefined;
      if (!attempt) return makeResponse(undefined, false, undefined, 'Attempt not found');
      try {
        const modules = JSON.parse(attempt.modules ?? '{}');
        return makeResponse(undefined, true, { ...attempt, modules });
      } catch {
        return makeResponse(undefined, false, undefined, 'Invalid attempt data');
      }
    } catch (e: any) {
      return makeResponse(undefined, false, undefined, e.message);
    }
  });

  ipcMain.handle('db:save_attempt', async (_event, { attempt }: { attempt: any }) => {
    try {
      const d = requireDb();
      const tx = d.transaction(() => {
        d.prepare(
          `INSERT INTO attempts (id, test_id, started_at, completed_at, status, total_score)
           VALUES (@id, @test_id, @started_at, @completed_at, @status, @total_score)
           ON CONFLICT(id) DO UPDATE SET
             test_id=excluded.test_id,
             completed_at=excluded.completed_at,
             status=excluded.status,
             total_score=excluded.total_score`
        ).run({
          id: attempt.id,
          test_id: attempt.testId,
          started_at: attempt.startedAt,
          completed_at: attempt.completedAt ?? null,
          status: attempt.status,
          total_score: JSON.stringify(attempt.totalScore ?? null),
        });

        for (const [key, module] of Object.entries(attempt.modules ?? {})) {
          const m = module as any;
          d.prepare(
            `INSERT INTO module_attempts (id, attempt_id, section_id, module, started_at, completed_at, deadline_at, duration_minutes, status, time_remaining_seconds, scores)
             VALUES (@id, @attempt_id, @section_id, @module, @started_at, @completed_at, @deadline_at, @duration_minutes, @status, @time_remaining_seconds, @scores)
             ON CONFLICT(id) DO UPDATE SET
               completed_at=excluded.completed_at,
               status=excluded.status,
               time_remaining_seconds=excluded.time_remaining_seconds,
               scores=excluded.scores`
          ).run({
            id: key,
            attempt_id: attempt.id,
            section_id: m.sectionId,
            module: m.module,
            started_at: m.startedAt,
            completed_at: m.completedAt ?? null,
            deadline_at: m.deadlineAt,
            duration_minutes: m.durationMinutes,
            status: m.status,
            time_remaining_seconds: m.timeRemainingSeconds,
            scores: JSON.stringify(m.scores ?? null),
          });

          for (const [qid, resp] of Object.entries(m.responses ?? {})) {
            const r = resp as any;
            d.prepare(
              `INSERT INTO responses (id, attempt_id, module_attempt_id, question_id, section_id, module, question_number, type, selected_option_id, numeric_answer, is_answered, marked_for_review, eliminated_option_ids, note, highlights, time_spent_seconds, last_updated)
               VALUES (@id, @attempt_id, @module_attempt_id, @question_id, @section_id, @module, @question_number, @type, @selected_option_id, @numeric_answer, @is_answered, @marked_for_review, @eliminated_option_ids, @note, @highlights, @time_spent_seconds, @last_updated)
               ON CONFLICT(id) DO UPDATE SET
                 selected_option_id=excluded.selected_option_id,
                 numeric_answer=excluded.numeric_answer,
                 is_answered=excluded.is_answered,
                 marked_for_review=excluded.marked_for_review,
                 eliminated_option_ids=excluded.eliminated_option_ids,
                 note=excluded.note,
                 highlights=excluded.highlights,
                 time_spent_seconds=excluded.time_spent_seconds,
                 last_updated=excluded.last_updated`
            ).run({
              id: `${key}-${qid}`,
              attempt_id: attempt.id,
              module_attempt_id: key,
              question_id: r.questionId,
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
        }
      });
      tx();
      return makeResponse(undefined, true, { saved: true });
    } catch (e: any) {
      return makeResponse(undefined, false, undefined, e.message);
    }
  });

  ipcMain.handle('db:save_response', async (_event, { response }: { response: any }) => {
    try {
      const d = requireDb();
      d.prepare(
        `INSERT INTO responses (id, attempt_id, module_attempt_id, question_id, section_id, module, question_number, type, selected_option_id, numeric_answer, is_answered, marked_for_review, eliminated_option_ids, note, highlights, time_spent_seconds, last_updated)
         VALUES (@id, @attempt_id, @module_attempt_id, @question_id, @section_id, @module, @question_number, @type, @selected_option_id, @numeric_answer, @is_answered, @marked_for_review, @eliminated_option_ids, @note, @highlights, @time_spent_seconds, @last_updated)
         ON CONFLICT(id) DO UPDATE SET
           selected_option_id=excluded.selected_option_id,
           numeric_answer=excluded.numeric_answer,
           is_answered=excluded.is_answered,
           marked_for_review=excluded.marked_for_review,
           eliminated_option_ids=excluded.eliminated_option_ids,
           note=excluded.note,
           highlights=excluded.highlights,
           time_spent_seconds=excluded.time_spent_seconds,
           last_updated=excluded.last_updated`
      ).run({
        id: `${response.moduleAttemptId}-${response.questionId}`,
        attempt_id: response.attemptId,
        module_attempt_id: response.moduleAttemptId,
        question_id: response.questionId,
        section_id: response.sectionId,
        module: response.module,
        question_number: response.questionNumber,
        type: response.type,
        selected_option_id: response.selectedOptionId ?? null,
        numeric_answer: response.numericAnswer ?? null,
        is_answered: response.isAnswered ? 1 : 0,
        marked_for_review: response.markedForReview ? 1 : 0,
        eliminated_option_ids: JSON.stringify(response.eliminatedOptionIds ?? []),
        note: response.note ?? null,
        highlights: JSON.stringify(response.highlights ?? []),
        time_spent_seconds: response.timeSpentSeconds ?? 0,
        last_updated: response.lastUpdated ?? Date.now(),
      });
      return makeResponse(undefined, true, { saved: true });
    } catch (e: any) {
      return makeResponse(undefined, false, undefined, e.message);
    }
  });

  ipcMain.handle('db:import_test', async (_event, { content }: { content: any }) => {
    try {
      const d = requireDb();
      const id = content.metadata?.id || `test_${Date.now()}`;
      const exists = d.prepare('SELECT id FROM tests WHERE id = ?').get(id);
      if (exists) {
        return makeResponse(undefined, false, undefined, 'Test already imported');
      }
      d.prepare(
        `INSERT INTO tests (id, title, description, version, total_questions, content, created_at, updated_at)
         VALUES (@id, @title, @description, @version, @total_questions, @content, @created_at, @updated_at)`
      ).run({
        id,
        title: content.metadata?.title || 'Imported Test',
        description: content.metadata?.description || '',
        version: content.metadata?.version || '1.0.0',
        total_questions: content.questions?.length || 0,
        content: JSON.stringify(content),
        created_at: Date.now(),
        updated_at: Date.now(),
      });
      return makeResponse(undefined, true, { id });
    } catch (e: any) {
      return makeResponse(undefined, false, undefined, e.message);
    }
  });

  ipcMain.handle('app:get_version', async () => ({
    success: true,
    data: app.getVersion(),
  }));

  ipcMain.handle('app:get_path', async (_event, { name }: { name: string }) => ({
    success: true,
    data: app.getPath(name as any),
  }));

  registerWindowIpcHandlers(ipcMain);

  app.on('will-quit', () => {
    closeDatabase();
  });
}
