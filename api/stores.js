// api/stores.js
// GET  /api/stores — list store codes
// POST /api/stores — save/update store codes (admin only)
// POST /api/stores (op: delete) — delete a store code

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

  try {
    await initDb();
    const sql = getDb();

    if (req.method === 'GET') {
      const rows = await sql`SELECT code, name, active FROM store_codes ORDER BY name`;
      return res.status(200).json({ codes: rows });
    }

    if (req.method === 'POST') {
      if (!requireAdmin(req, res)) return;

      const { op, codes, code, name } = req.body || {};

      if (op === 'save' && Array.isArray(codes)) {
        // Full replace — delete all and re-insert
        await sql`DELETE FROM store_codes`;
        for (const sc of codes) {
          const c = String(sc.code || '').slice(0, 100).trim().toUpperCase();
          const n = String(sc.name || '').slice(0, 200).trim();
          if (c && n) {
            await sql`
              INSERT INTO store_codes (code, name)
              VALUES (${c}, ${n})
              ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name`;
          }
        }
        return res.status(200).json({ success: true });
      }

      if (op === 'add' && code && name) {
        const c = String(code).slice(0, 100).trim().toUpperCase();
        const n = String(name).slice(0, 200).trim();
        await sql`
          INSERT INTO store_codes (code, name)
          VALUES (${c}, ${n})
          ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name`;
        return res.status(200).json({ success: true });
      }

      if (op === 'delete' && code) {
        await sql`DELETE FROM store_codes WHERE code = ${code}`;
        return res.status(200).json({ success: true });
      }

      return res.status(400).json({ error: 'Invalid op' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err) {
    console.error('stores error:', err);
    return res.status(500).json({ error: err.message });
  }
}
