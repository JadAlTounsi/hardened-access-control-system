import Database from 'better-sqlite3';

const db = new Database('access.db');

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
    CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        uid TEXT NOT NULL UNIQUE,
        first_name TEXT NOT NULL,
        last_name TEXT NOT NULL,
        is_active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS access_logs (
        id INTEGER PRIMARY KEY,
        user_id INTEGER,
        event TEXT NOT NULL,
        severity TEXT NOT NULL,
        timestamp TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        attempts INTEGER,
        expires_at TEXT,
        FOREIGN KEY (user_id) REFERENCES users(id)
    );
`);

export default db;