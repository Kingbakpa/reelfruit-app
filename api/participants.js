// api/participants.js
// GET /api/participants — fetch participant records (admin only)

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
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Key');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (!requireAdmin(req, res)) return;

  try {
    await initDb();
    const sql = getDb();
    const { search, store, result, from, to, limit = '500' } = req.query;

    let rows;
    const lim = Math.min(parseInt(limit) || 500, 5000);

    // Build dynamic WHERE conditions
    // Neon tagged template literals require fixed structure, so we branch
    if (search && store && result) {
      const s = `%${search}%`;
      rows = await sql`
        SELECT * FROM participants
        WHERE (first_name ILIKE ${s} OR last_name ILIKE ${s} OR contact ILIKE ${s} OR store_code ILIKE ${s})
          AND store_code = ${store}
          AND won = ${result === 'won' ? 'Won' : 'Lost'}
        ORDER BY created_at DESC LIMIT ${lim}`;
    } else if (search && store) {
      const s = `%${search}%`;
      rows = await sql`
        SELECT * FROM participants
        WHERE (first_name ILIKE ${s} OR last_name ILIKE ${s} OR contact ILIKE ${s} OR store_code ILIKE ${s})
          AND store_code = ${store}
        ORDER BY created_at DESC LIMIT ${lim}`;
    } else if (search && result) {
      const s = `%${search}%`;
      rows = await sql`
        SELECT * FROM participants
        WHERE (first_name ILIKE ${s} OR last_name ILIKE ${s} OR contact ILIKE ${s} OR store_code ILIKE ${s})
          AND won = ${result === 'won' ? 'Won' : 'Lost'}
        ORDER BY created_at DESC LIMIT ${lim}`;
    } else if (store && result) {
      rows = await sql`
        SELECT * FROM participants
        WHERE store_code = ${store} AND won = ${result === 'won' ? 'Won' : 'Lost'}
        ORDER BY created_at DESC LIMIT ${lim}`;
    } else if (search) {
      const s = `%${search}%`;
      rows = await sql`
        SELECT * FROM participants
        WHERE (first_name ILIKE ${s} OR last_name ILIKE ${s} OR contact ILIKE ${s} OR store_code ILIKE ${s})
        ORDER BY created_at DESC LIMIT ${lim}`;
    } else if (store) {
      rows = await sql`
        SELECT * FROM participants WHERE store_code = ${store}
        ORDER BY created_at DESC LIMIT ${lim}`;
    } else if (result) {
      rows = await sql`
        SELECT * FROM participants WHERE won = ${result === 'won' ? 'Won' : 'Lost'}
        ORDER BY created_at DESC LIMIT ${lim}`;
    } else {
      rows = await sql`
        SELECT * FROM participants ORDER BY created_at DESC LIMIT ${lim}`;
    }

    return res.status(200).json({ data: rows, count: rows.length });
  } catch (err) {
    console.error('participants error:', err);
    return res.status(500).json({ error: err.message });
  }
}
