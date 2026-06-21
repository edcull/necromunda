'use strict';
const express = require('express');
const session = require('express-session');
const path = require('path');
const fs = require('fs');
const db = require('./db');

// Load .env file if present (simple key=value, no library needed)
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const m = line.match(/^\s*([^#=]+?)\s*=\s*(.*?)\s*$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2];
  });
}

const SESSION_SECRET = process.env.SESSION_SECRET;
if (!SESSION_SECRET || SESSION_SECRET === 'CHANGE_ME_IN_PRODUCTION') {
  console.warn('WARNING: SESSION_SECRET not set or still default. Set it in .env before deploying publicly.');
}

// Session store using better-sqlite3
const SqliteStore = require('better-sqlite3-session-store')(session);

const app = express();
app.set('trust proxy', 1);

app.use(express.json());

app.use(session({
  store: new SqliteStore({ client: db }),
  secret: SESSION_SECRET || 'CHANGE_ME_IN_PRODUCTION',
  resave: false,
  saveUninitialized: false,
  cookie: { httpOnly: true, sameSite: 'lax' }
}));

// Static files served under /necromunda
app.use('/necromunda', express.static(path.join(__dirname, '..', 'public')));

// Auth and campaign routes
app.use(require('./routes/auth'));
app.use(require('./routes/campaigns'));

// SPA entry points
app.get('/necromunda', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});
app.get('/necromunda/campaign/:id', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'app.html'));
});

const PORT = 3001;
app.listen(PORT, () => console.log(`Necromunda server running on http://localhost:${PORT}/necromunda`));
