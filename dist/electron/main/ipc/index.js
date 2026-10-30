"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerIpcHandlers = registerIpcHandlers;
const electron_1 = require("electron");
const db_1 = require("../database/db");
const ipc_validator_1 = require("../security/ipc-validator");
const window_1 = require("../window");
let db = null;
function requireDb() {
    if (!db)
        throw new Error('Database not initialized');
    return db;
}
function registerIpcHandlers() {
    electron_1.ipcMain.handle('db:init', async () => {
        db = (0, db_1.initDatabase)();
        return (0, ipc_validator_1.makeResponse)(undefined, true, { initialized: true });
    });
    electron_1.ipcMain.handle('db:get_tests', async () => {
        try {
            const d = requireDb();
            const rows = d
                .prepare('SELECT id, title, description, version, total_questions, created_at, updated_at FROM tests')
                .all();
            return (0, ipc_validator_1.makeResponse)(undefined, true, rows);
        }
        catch (e) {
            return (0, ipc_validator_1.makeResponse)(undefined, false, undefined, e.message);
        }
    });
    electron_1.ipcMain.handle('db:get_test', async (_event, { testId }) => {
        try {
            const d = requireDb();
            const row = d
                .prepare('SELECT * FROM tests WHERE id = ?')
                .get(testId);
            if (!row)
                return (0, ipc_validator_1.makeResponse)(undefined, false, undefined, 'Test not found');
            try {
                const content = JSON.parse(row.content);
                return (0, ipc_validator_1.makeResponse)(undefined, true, content);
            }
            catch {
                return (0, ipc_validator_1.makeResponse)(undefined, false, undefined, 'Invalid test content');
            }
        }
        catch (e) {
            return (0, ipc_validator_1.makeResponse)(undefined, false, undefined, e.message);
        }
    });
    electron_1.ipcMain.handle('db:get_attempts', async () => {
        try {
            const d = requireDb();
            const rows = d
                .prepare('SELECT * FROM attempts ORDER BY started_at DESC')
                .all();
            return (0, ipc_validator_1.makeResponse)(undefined, true, rows);
        }
        catch (e) {
            return (0, ipc_validator_1.makeResponse)(undefined, false, undefined, e.message);
        }
    });
    electron_1.ipcMain.handle('db:get_attempt', async (_event, { attemptId }) => {
        try {
            const d = requireDb();
            const attempt = d
                .prepare('SELECT * FROM attempts WHERE id = ?')
                .get(attemptId);
            if (!attempt)
                return (0, ipc_validator_1.makeResponse)(undefined, false, undefined, 'Attempt not found');
            try {
                const modules = JSON.parse(attempt.modules ?? '{}');
                return (0, ipc_validator_1.makeResponse)(undefined, true, { ...attempt, modules });
            }
            catch {
                return (0, ipc_validator_1.makeResponse)(undefined, false, undefined, 'Invalid attempt data');
            }
        }
        catch (e) {
            return (0, ipc_validator_1.makeResponse)(undefined, false, undefined, e.message);
        }
    });
    electron_1.ipcMain.handle('db:save_attempt', async (_event, { attempt }) => {
        try {
            const d = requireDb();
            const tx = d.transaction(() => {
                d.prepare(`INSERT INTO attempts (id, test_id, started_at, completed_at, status, total_score)
           VALUES (@id, @test_id, @started_at, @completed_at, @status, @total_score)
           ON CONFLICT(id) DO UPDATE SET
             test_id=excluded.test_id,
             completed_at=excluded.completed_at,
             status=excluded.status,
             total_score=excluded.total_score`).run({
                    id: attempt.id,
                    test_id: attempt.testId,
                    started_at: attempt.startedAt,
                    completed_at: attempt.completedAt ?? null,
                    status: attempt.status,
                    total_score: JSON.stringify(attempt.totalScore ?? null),
                });
                for (const [key, module] of Object.entries(attempt.modules ?? {})) {
                    const m = module;
                    d.prepare(`INSERT INTO module_attempts (id, attempt_id, section_id, module, started_at, completed_at, deadline_at, duration_minutes, status, time_remaining_seconds, scores)
             VALUES (@id, @attempt_id, @section_id, @module, @started_at, @completed_at, @deadline_at, @duration_minutes, @status, @time_remaining_seconds, @scores)
             ON CONFLICT(id) DO UPDATE SET
               completed_at=excluded.completed_at,
               status=excluded.status,
               time_remaining_seconds=excluded.time_remaining_seconds,
               scores=excluded.scores`).run({
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
                        const r = resp;
                        d.prepare(`INSERT INTO responses (id, attempt_id, module_attempt_id, question_id, section_id, module, question_number, type, selected_option_id, numeric_answer, is_answered, marked_for_review, eliminated_option_ids, note, highlights, time_spent_seconds, last_updated)
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
                 last_updated=excluded.last_updated`).run({
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
            return (0, ipc_validator_1.makeResponse)(undefined, true, { saved: true });
        }
        catch (e) {
            return (0, ipc_validator_1.makeResponse)(undefined, false, undefined, e.message);
        }
    });
    electron_1.ipcMain.handle('db:save_response', async (_event, { response }) => {
        try {
            const d = requireDb();
            d.prepare(`INSERT INTO responses (id, attempt_id, module_attempt_id, question_id, section_id, module, question_number, type, selected_option_id, numeric_answer, is_answered, marked_for_review, eliminated_option_ids, note, highlights, time_spent_seconds, last_updated)
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
           last_updated=excluded.last_updated`).run({
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
            return (0, ipc_validator_1.makeResponse)(undefined, true, { saved: true });
        }
        catch (e) {
            return (0, ipc_validator_1.makeResponse)(undefined, false, undefined, e.message);
        }
    });
    electron_1.ipcMain.handle('db:import_test', async (_event, { content }) => {
        try {
            const d = requireDb();
            const id = content.metadata?.id || `test_${Date.now()}`;
            const exists = d.prepare('SELECT id FROM tests WHERE id = ?').get(id);
            if (exists) {
                return (0, ipc_validator_1.makeResponse)(undefined, false, undefined, 'Test already imported');
            }
            d.prepare(`INSERT INTO tests (id, title, description, version, total_questions, content, created_at, updated_at)
         VALUES (@id, @title, @description, @version, @total_questions, @content, @created_at, @updated_at)`).run({
                id,
                title: content.metadata?.title || 'Imported Test',
                description: content.metadata?.description || '',
                version: content.metadata?.version || '1.0.0',
                total_questions: content.questions?.length || 0,
                content: JSON.stringify(content),
                created_at: Date.now(),
                updated_at: Date.now(),
            });
            return (0, ipc_validator_1.makeResponse)(undefined, true, { id });
        }
        catch (e) {
            return (0, ipc_validator_1.makeResponse)(undefined, false, undefined, e.message);
        }
    });
    electron_1.ipcMain.handle('app:get_version', async () => ({
        success: true,
        data: electron_1.app.getVersion(),
    }));
    electron_1.ipcMain.handle('app:get_path', async (_event, { name }) => ({
        success: true,
        data: electron_1.app.getPath(name),
    }));
    (0, window_1.registerWindowIpcHandlers)(electron_1.ipcMain);
    electron_1.app.on('will-quit', () => {
        (0, db_1.closeDatabase)();
    });
}
