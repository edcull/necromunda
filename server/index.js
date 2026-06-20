'use strict';
const express = require('express');
const session = require('express-session');
const path = require('path');
const db = require('./db');

// Session store using better-sqlite3
const SqliteStore = require('better-sqlite3-session-store')(session);

const app = express();
app.set('trust proxy', 1);

app.use(express.json());

app.use(session({
  store: new SqliteStore({ client: db }),
  secret: 'CHANGE_ME_IN_PRODUCTION', // TODO: set a strong secret via environment variable
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
