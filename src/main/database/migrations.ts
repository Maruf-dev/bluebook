import Database from 'better-sqlite3';

export interface Migration {
  id: number;
  name: string;
  up: (db: Database.Database) => void;
}

export const MIGRATIONS: Migration[] = [
  {
    id: 1,
    name: 'initial_schema',
    up: (db: Database.Database) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_preferences (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tests (
          id TEXT PRIMARY KEY,
          title TEXT NOT NULL,
          description TEXT NOT NULL,
          version TEXT NOT NULL,
          total_questions INTEGER NOT NULL,
          content TEXT NOT NULL,
          created_at INTEGER NOT NULL,
          updated_at INTEGER NOT NULL
        );

        CREATE TABLE IF NOT EXISTS attempts (
          id TEXT PRIMARY KEY,
          test_id TEXT NOT NULL,
          started_at INTEGER NOT NULL,
          completed_at INTEGER,
          status TEXT NOT NULL DEFAULT 'in_progress',
          total_score TEXT,
          FOREIGN KEY (test_id) REFERENCES tests(id)
        );

        CREATE TABLE IF NOT EXISTS module_attempts (
          id TEXT PRIMARY KEY,
          attempt_id TEXT NOT NULL,
          section_id TEXT NOT NULL,
          module INTEGER NOT NULL,
          started_at INTEGER NOT NULL,
          completed_at INTEGER,
          deadline_at INTEGER NOT NULL,
          duration_minutes INTEGER NOT NULL,
          status TEXT NOT NULL DEFAULT 'in_progress',
          time_remaining_seconds INTEGER NOT NULL,
          scores TEXT,
          FOREIGN KEY (attempt_id) REFERENCES attempts(id)
        );

        CREATE TABLE IF NOT EXISTS responses (
          id TEXT PRIMARY KEY,
          attempt_id TEXT NOT NULL,
          module_attempt_id TEXT NOT NULL,
          question_id TEXT NOT NULL,
          section_id TEXT NOT NULL,
          module INTEGER NOT NULL,
          question_number INTEGER NOT NULL,
          type TEXT NOT NULL,
          selected_option_id TEXT,
          numeric_answer TEXT,
          is_answered INTEGER NOT NULL DEFAULT 0,
          marked_for_review INTEGER NOT NULL DEFAULT 0,
          eliminated_option_ids TEXT NOT NULL DEFAULT '[]',
          note TEXT,
          highlights TEXT NOT NULL DEFAULT '[]',
          time_spent_seconds INTEGER NOT NULL DEFAULT 0,
          last_updated INTEGER NOT NULL,
          FOREIGN KEY (attempt_id) REFERENCES attempts(id),
          FOREIGN KEY (module_attempt_id) REFERENCES module_attempts(id)
        );

        CREATE INDEX IF NOT EXISTS idx_responses_attempt ON responses(attempt_id);
        CREATE INDEX IF NOT EXISTS idx_responses_question ON responses(question_id);
        CREATE INDEX IF NOT EXISTS idx_module_attempts_attempt ON module_attempts(attempt_id);
      `);
    },
  },
  {
    id: 2,
    name: 'add_settings_table',
    up: (db: Database.Database) => {
      db.exec(`
        CREATE TABLE IF NOT EXISTS settings (
          key TEXT PRIMARY KEY,
          value TEXT NOT NULL
        );
      `);
    },
  },
];

export function getLatestMigrationId(): number {
  const last = MIGRATIONS[MIGRATIONS.length - 1];
  return last ? last.id : 0;
}
