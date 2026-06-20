'use strict';
const express = require('express');
const db = require('../db');
const router = express.Router();

const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion
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

// Random sector name: "SECTOR A3-K7 — CHEM SUMP"
const SECTOR_DESCRIPTORS = ['CHEM', 'SHADOW', 'RAT', 'TOX', 'BLIGHT', 'RAD', 'DARK', 'BONE', 'ASH', 'GROT'];
const SECTOR_LOCATIONS   = ['WASTES', 'SUMP', 'SPIRE', 'WARRENS', 'DEPTHS', 'DOMES', 'PITS', 'FLATS', 'REACHES', 'HOLLOWS'];
const SECTOR_LETTERS = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomSectorName() {
  const code = `${pick(SECTOR_LETTERS)}${1 + Math.floor(Math.random() * 9)}-${pick(SECTOR_LETTERS)}${1 + Math.floor(Math.random() * 9)}`;
  return `SECTOR ${code} — ${pick(SECTOR_DESCRIPTORS)} ${pick(SECTOR_LOCATIONS)}`;
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
  const id = uniqueId();
  const sector = randomSectorName();
  // Initial state: name = campaign ID, sector = random generated name
  const initialState = JSON.stringify({ campaign: id, sector });
  db.prepare('INSERT INTO campaigns (id, name, arbitrator_id, state_json) VALUES (?, ?, ?, ?)').run(id, id, req.session.user.id, initialState);
  res.json({ id, name: id, sector });
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
  const name = (state && state.campaign) ? String(state.campaign).trim() || campaign.id : campaign.id;
  db.prepare('UPDATE campaigns SET state_json = ?, name = ? WHERE id = ?').run(JSON.stringify(state), name, campaign.id);
  res.json({ ok: true });
});

module.exports = router;
