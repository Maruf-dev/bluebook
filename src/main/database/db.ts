import Database from 'better-sqlite3';
import path from 'node:path';
import { app } from 'electron';
import { MIGRATIONS, getLatestMigrationId } from './migrations';
import sampleTest from '../../shared/content/sample-test.json';

export type DB = Database.Database;

let dbInstance: DB | null = null;

export function getDbPath(): string {
  const userData = app.getPath('userData');
  return path.join(userData, 'examdesk.db');
}

export function initDatabase(): DB {
  if (dbInstance) return dbInstance;

  const db = new Database(getDbPath());
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  const row = db
    .prepare("SELECT value FROM settings WHERE key = 'db_version'")
    .get() as { value: string } | undefined;
  const currentVersion = row ? parseInt(row.value, 10) : 0;

  for (const migration of MIGRATIONS) {
    if (migration.id > currentVersion) {
      migration.up(db);
    }
  }

  db.prepare(
    "INSERT INTO settings (key, value) VALUES ('db_version', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).run(String(getLatestMigrationId()));

  // Seed sample test if database is empty (first run)
  const testCount = db.prepare('SELECT COUNT(*) as c FROM tests').get() as { c: number };
  if (testCount.c === 0) {
    const tx = db.transaction(() => {
      db.prepare(
        `INSERT INTO tests (id, title, description, version, total_questions, content, created_at, updated_at)
         VALUES (@id, @title, @description, @version, @total_questions, @content, @created_at, @updated_at)`
      ).run({
        id: sampleTest.metadata.id,
        title: sampleTest.metadata.title,
        description: sampleTest.metadata.description,
        version: sampleTest.metadata.version,
        total_questions: sampleTest.metadata.total_questions,
        content: JSON.stringify(sampleTest),
        created_at: sampleTest.metadata.createdAt,
        updated_at: sampleTest.metadata.updatedAt,
      });
    });
    tx();
  }

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
