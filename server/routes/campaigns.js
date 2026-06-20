'use strict';
const express = require('express');
const db = require('../db');
const router = express.Router();

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
function genId() {
  let id = '';
  for (let i = 0; i < 4; i++) id += CHARS[Math.floor(Math.random() * CHARS.length)];
  return id;
}
function uniqueId() {
  let id, tries = 0;
  do { id = genId(); tries++; } while (db.prepare('SELECT 1 FROM campaigns WHERE id = ?').get(id) && tries < 100);
  return id;
}

function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Not logged in' });
  next();
}

router.get('/necromunda/api/campaigns', (req, res) => {
  const rows = db.prepare(`
    SELECT c.id, c.name, c.created_at, a.username AS arbitrator
    FROM campaigns c
    JOIN arbitrators a ON a.id = c.arbitrator_id
    ORDER BY c.created_at DESC
  `).all();
  res.json(rows);
});

router.post('/necromunda/api/campaigns', requireAuth, (req, res) => {
  const { name } = req.body || {};
  if (!name) return res.status(400).json({ error: 'name required' });
  const id = uniqueId();
  db.prepare('INSERT INTO campaigns (id, name, arbitrator_id) VALUES (?, ?, ?)').run(id, name.trim(), req.session.user.id);
  res.json({ id, name: name.trim() });
});

router.get('/necromunda/api/campaigns/:id', (req, res) => {
  const row = db.prepare(`
    SELECT c.id, c.name, c.state_json, c.created_at, a.username AS arbitrator, c.arbitrator_id
    FROM campaigns c
    JOIN arbitrators a ON a.id = c.arbitrator_id
    WHERE c.id = ?
  `).get(req.params.id.toUpperCase());
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

router.patch('/necromunda/api/campaigns/:id/state', requireAuth, (req, res) => {
  const campaign = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(req.params.id.toUpperCase());
  if (!campaign) return res.status(404).json({ error: 'Not found' });
  if (campaign.arbitrator_id !== req.session.user.id) return res.status(403).json({ error: 'Forbidden' });
  const { state } = req.body || {};
  if (state === undefined) return res.status(400).json({ error: 'state required' });
  db.prepare('UPDATE campaigns SET state_json = ? WHERE id = ?').run(JSON.stringify(state), campaign.id);
  res.json({ ok: true });
});

module.exports = router;
