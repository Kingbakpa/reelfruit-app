// api/admin.js
// POST /api/admin?op=clear  — delete all participants
// POST /api/admin?op=init   — initialize database tables
// GET  /api/admin?op=ping   — health check

import { getDb, initDb } from '../lib/db.js';

function requireAdmin(req, res) {
  const key = req.headers['x-admin-key'] || req.query.key || '';
  if (key !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  const op = req.query.op || req.body?.op || '';

  // Ping — no auth needed
  if (op === 'ping') {
    try {
      await initDb();
      const sql = getDb();
      const [row] = await sql`SELECT NOW() as time`;
      return res.status(200).json({ status: 'ok', time: row.time, db: 'connected' });
    } catch (err) {
      return res.status(500).json({ status: 'error', error: err.message });
    }
  }

  // Init — creates tables
  if (op === 'init') {
    if (!requireAdmin(req, res)) return;
    try {
      await initDb();
      return res.status(200).json({ success: true, message: 'Database initialized' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // Clear all participants
  if (op === 'clear') {
    if (!requireAdmin(req, res)) return;
    if (req.method !== 'POST') return res.status(405).json({ error: 'POST required' });
    try {
      const sql = getDb();
      const result = await sql`DELETE FROM participants`;
      return res.status(200).json({ success: true });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  return res.status(400).json({ error: 'Unknown op. Use: ping, init, clear' });
}
