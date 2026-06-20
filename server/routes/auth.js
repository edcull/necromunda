'use strict';
const express = require('express');
const bcrypt = require('bcrypt');
const db = require('../db');
const router = express.Router();

const ROUNDS = 10;

router.post('/necromunda/api/auth/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  try {
    const hash = await bcrypt.hash(password, ROUNDS);
    const stmt = db.prepare('INSERT INTO arbitrators (username, password_hash) VALUES (?, ?)');
    const info = stmt.run(username.trim(), hash);
    const user = { id: info.lastInsertRowid, username: username.trim() };
    req.session.user = user;
    res.json(user);
  } catch (e) {
    if (e.message && e.message.includes('UNIQUE')) return res.status(409).json({ error: 'Username already taken' });
    console.error(e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/necromunda/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });
  const row = db.prepare('SELECT * FROM arbitrators WHERE username = ?').get(username.trim());
  if (!row) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  const user = { id: row.id, username: row.username };
  req.session.user = user;
  res.json(user);
});

router.post('/necromunda/api/auth/logout', (req, res) => {
  req.session.destroy(() => res.sendStatus(204));
});

router.get('/necromunda/api/auth/me', (req, res) => {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  res.json(req.session.user);
});

module.exports = router;
