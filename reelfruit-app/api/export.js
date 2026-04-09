// api/export.js
// GET /api/export — download all participants as CSV (admin only)

import { getDb, initDb } from '../lib/db.js';

function requireAdmin(req, res) {
  const key = req.headers['x-admin-key'] || req.query.key || '';
  if (key !== process.env.ADMIN_SECRET) {
    res.status(401).json({ error: 'Unauthorized' });
    return false;
  }
  return true;
}

function escCsv(val) {
  const s = String(val == null ? '' : val);
  return s.includes(',') || s.includes('"') || s.includes('\n')
    ? '"' + s.replace(/"/g, '""') + '"'
    : s;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!requireAdmin(req, res)) return;

  try {
    await initDb();
    const sql = getDb();

    const rows = await sql`SELECT * FROM participants ORDER BY created_at DESC`;

    const cols = [
      'id','session_id','first_name','last_name','contact',
      'store_code','store_name','score','total_questions','score_pct','won',
      'prize_type','prize_value','start_time','end_time','duration_sec',
      'latitude','longitude','location_accuracy',
      'answers_detail','ip_address','created_at'
    ];

    const date = new Date().toISOString().slice(0,10);
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="ReelFruit_Participants_${date}.csv"`);

    // UTF-8 BOM so Excel opens correctly
    let csv = '\uFEFF';
    csv += cols.join(',') + '\n';
    for (const row of rows) {
      csv += cols.map(c => escCsv(row[c])).join(',') + '\n';
    }

    return res.status(200).send(csv);
  } catch (err) {
    console.error('export error:', err);
    return res.status(500).json({ error: err.message });
  }
}
