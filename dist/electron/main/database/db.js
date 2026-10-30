"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDbPath = getDbPath;
exports.initDatabase = initDatabase;
exports.closeDatabase = closeDatabase;
exports.getDb = getDb;
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const node_path_1 = __importDefault(require("node:path"));
const electron_1 = require("electron");
const migrations_1 = require("./migrations");
const sample_test_json_1 = __importDefault(require("../../shared/content/sample-test.json"));
let dbInstance = null;
function getDbPath() {
    const userData = electron_1.app.getPath('userData');
    return node_path_1.default.join(userData, 'examdesk.db');
}
function initDatabase() {
    if (dbInstance)
        return dbInstance;
    const db = new better_sqlite3_1.default(getDbPath());
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    const row = db
        .prepare("SELECT value FROM settings WHERE key = 'db_version'")
        .get();
    const currentVersion = row ? parseInt(row.value, 10) : 0;
    for (const migration of migrations_1.MIGRATIONS) {
        if (migration.id > currentVersion) {
            migration.up(db);
        }
    }
    db.prepare("INSERT INTO settings (key, value) VALUES ('db_version', ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value").run(String((0, migrations_1.getLatestMigrationId)()));
    // Seed sample test if database is empty (first run)
    const testCount = db.prepare('SELECT COUNT(*) as c FROM tests').get();
    if (testCount.c === 0) {
        const tx = db.transaction(() => {
            db.prepare(`INSERT INTO tests (id, title, description, version, total_questions, content, created_at, updated_at)
         VALUES (@id, @title, @description, @version, @total_questions, @content, @created_at, @updated_at)`).run({
                id: sample_test_json_1.default.metadata.id,
                title: sample_test_json_1.default.metadata.title,
                description: sample_test_json_1.default.metadata.description,
                version: sample_test_json_1.default.metadata.version,
                total_questions: sample_test_json_1.default.metadata.total_questions,
                content: JSON.stringify(sample_test_json_1.default),
                created_at: sample_test_json_1.default.metadata.createdAt,
                updated_at: sample_test_json_1.default.metadata.updatedAt,
            });
        });
        tx();
    }
    dbInstance = db;
    return db;
}
function closeDatabase() {
    if (dbInstance) {
        dbInstance.close();
        dbInstance = null;
    }
}
function getDb() {
    if (!dbInstance)
        throw new Error('Database not initialized');
    return dbInstance;
}
