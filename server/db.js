'use strict';
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(path.join(dataDir, 'necromunda.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS arbitrators (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at INTEGER DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS campaigns (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    arbitrator_id INTEGER NOT NULL,
    state_json TEXT,
    created_at INTEGER DEFAULT (unixepoch()),
    FOREIGN KEY(arbitrator_id) REFERENCES arbitrators(id)
  );
`);

module.exports = db;
