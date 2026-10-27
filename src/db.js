const Database = require('better-sqlite3');

function openDb(filename = process.env.DB_FILE || 'data.db') {
  const db = new Database(filename);
  db.pragma('journal_mode = WAL');
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      customer    TEXT NOT NULL,
      phone       TEXT NOT NULL,
      starts_at   TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'pending',
      updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS calls (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      appointment_id  INTEGER NOT NULL REFERENCES appointments(id),
      provider_ref    TEXT NOT NULL,
      created_at      TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  return db;
}

module.exports = { openDb };
