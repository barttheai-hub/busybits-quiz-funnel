import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.resolve(process.cwd(), 'data/mission-control.db');
export const db = new Database(DB_PATH);

export function migrate() {
  db.pragma('journal_mode = WAL');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member',
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL,
      health TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      tags_json TEXT NOT NULL DEFAULT '[]',
      project_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL DEFAULT '',
      owner TEXT NOT NULL,
      status TEXT NOT NULL,
      priority TEXT NOT NULL,
      impact_type TEXT NOT NULL DEFAULT 'Other',
      impact_score INTEGER NOT NULL DEFAULT 0,
      due_date TEXT,
      project_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS resources (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      preview TEXT NOT NULL DEFAULT '',
      url TEXT NOT NULL DEFAULT '',
      project_id TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      message TEXT NOT NULL,
      payload_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL
    );
  `);

  const taskColumns = db.prepare(`PRAGMA table_info(tasks)`).all().map(c => c.name);
  if (!taskColumns.includes('impact_type')) {
    db.exec(`ALTER TABLE tasks ADD COLUMN impact_type TEXT NOT NULL DEFAULT 'Other'`);
  }
  if (!taskColumns.includes('impact_score')) {
    db.exec(`ALTER TABLE tasks ADD COLUMN impact_score INTEGER NOT NULL DEFAULT 0`);
  }
}

