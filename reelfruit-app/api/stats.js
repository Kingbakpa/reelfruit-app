// api/stats.js
// GET /api/stats — summary statistics (admin only)

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

    const [totRow]   = await sql`SELECT COUNT(*)::int as n FROM participants`;
    const [wonRow]   = await sql`SELECT COUNT(*)::int as n FROM participants WHERE won = 'Won'`;
    const [storeRow] = await sql`SELECT COUNT(DISTINCT store_code)::int as n FROM participants WHERE store_code != ''`;
    const [locRow]   = await sql`SELECT COUNT(*)::int as n FROM participants WHERE latitude != '' AND latitude NOT IN ('N/A','Denied','')`;
    const [todayRow] = await sql`SELECT COUNT(*)::int as n FROM participants WHERE created_at::date = CURRENT_DATE`;
    const [avgRow]   = await sql`SELECT ROUND(AVG(score),1) as avg FROM participants`;

    const byStore = await sql`
      SELECT store_code, store_name, COUNT(*)::int as plays, SUM(CASE WHEN won='Won' THEN 1 ELSE 0 END)::int as wins
      FROM participants WHERE store_code != ''
      GROUP BY store_code, store_name ORDER BY plays DESC LIMIT 20`;

    const byDay = await sql`
      SELECT created_at::date as day, COUNT(*)::int as plays, SUM(CASE WHEN won='Won' THEN 1 ELSE 0 END)::int as wins
      FROM participants GROUP BY created_at::date ORDER BY day DESC LIMIT 30`;

    const total = totRow.n;
    const won   = wonRow.n;

    return res.status(200).json({
      total,
      won,
      lost:          total - won,
      win_rate:      total > 0 ? Math.round((won / total) * 100) + '%' : '0%',
      stores:        storeRow.n,
      with_location: locRow.n,
      today:         todayRow.n,
      avg_score:     parseFloat(avgRow.avg) || 0,
      by_store:      byStore,
      by_day:        byDay,
    });
  } catch (err) {
    console.error('stats error:', err);
    return res.status(500).json({ error: err.message });
  }
}
