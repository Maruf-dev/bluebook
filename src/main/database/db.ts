import Database from 'better-sqlite3';
import path from 'node:path';
import { app } from 'electron';
import { MIGRATIONS, getLatestMigrationId } from './migrations';
import sampleTestJson from '../../shared/content/sample-test.json';
import type { TestContent } from '../../shared/types';

export type DB = Database.Database;

const sampleTest = sampleTestJson as unknown as TestContent;

let dbInstance: DB | null = null;

export function getDbPath(): string {
  return path.join(app.getPath('userData'), 'examdesk.db');
}

function runMigrations(db: DB) {
  // The version is stored in `settings`, so that table must exist before we can read it.
  db.exec('CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL)');
  const row = db.prepare("SELECT value FROM settings WHERE key = 'db_version'").get() as
    | { value: string }
    | undefined;
  const currentVersion = row ? parseInt(row.value, 10) || 0 : 0;

  const pending = MIGRATIONS.filter((m) => m.id > currentVersion);
  if (pending.length === 0) return;

  db.transaction(() => {
    for (const migration of pending) migration.up(db);
    db.prepare(
      "INSERT INTO settings (key, value) VALUES ('db_version', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    ).run(String(getLatestMigrationId()));
  })();
}

/** Keeps the bundled sample test in sync with the version shipped in the app. */
function upsertSampleTest(db: DB) {
  const now = Date.now();
  db.prepare(
    `INSERT INTO tests (id, title, description, version, total_questions, content, created_at, updated_at)
     VALUES (@id, @title, @description, @version, @total_questions, @content, @created_at, @updated_at)
     ON CONFLICT(id) DO UPDATE SET
       title = excluded.title,
       description = excluded.description,
       version = excluded.version,
       total_questions = excluded.total_questions,
       content = excluded.content,
       updated_at = excluded.updated_at
     WHERE tests.version <> excluded.version`
  ).run({
    id: sampleTest.metadata.id,
    title: sampleTest.metadata.title,
    description: sampleTest.metadata.description,
    version: sampleTest.metadata.version,
    total_questions: sampleTest.questions.length,
    content: JSON.stringify(sampleTest),
    created_at: sampleTest.metadata.createdAt ?? now,
    updated_at: now,
  });
}

export function initDatabase(): DB {
  if (dbInstance) return dbInstance;

  const db = new Database(getDbPath());
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  runMigrations(db);
  upsertSampleTest(db);

  dbInstance = db;
  return db;
}

export function closeDatabase(): void {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
}

export function getDb(): DB {
  if (!dbInstance) throw new Error('Database not initialized');
  return dbInstance;
}
