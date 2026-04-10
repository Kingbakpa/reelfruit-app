// api/submit.js
// POST /api/submit — saves a quiz participant to Neon database

import { getDb, initDb } from '../lib/db.js';

export default async function handler(req, res) {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'POST required' });
  }

  try {
    await initDb(); // Ensure tables exist (fast no-op if already created)
    const sql = getDb();
    const b = req.body || {};

    const san = (v, max = 500) => String(v || '').slice(0, max).trim();
    const num = (v) => parseInt(v) || 0;

    await sql`
      INSERT INTO participants (
        session_id, first_name, last_name, contact,
        store_code, store_name,
        score, total_questions, score_pct, won,
        prize_type, prize_value,
        start_time, end_time, duration_sec,
        latitude, longitude, location_accuracy,
        answers_detail, ip_address, user_agent
      ) VALUES (
        ${san(b.id || ('P' + Date.now()))},
        ${san(b.firstName)}, ${san(b.lastName)}, ${san(b.contact)},
        ${san(b.storeCode)}, ${san(b.storeName)},
        ${num(b.score)}, ${num(b.total) || 3}, ${san(b.pct)}, ${san(b.won)},
        ${san(b.prizeType)}, ${san(b.prize)},
        ${san(b.startTime)}, ${san(b.endTime)},
        ${num(String(b.duration || '0').replace('s', ''))},
        ${san(b.lat)}, ${san(b.lng)}, ${san(b.accuracy)},
        ${san(b.answers, 3000)},
        ${req.headers['x-forwarded-for'] || req.socket?.remoteAddress || ''},
        ${san(req.headers['user-agent'] || '', 300)}
      )
    `;

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('submit error:', err);
    return res.status(500).json({ error: err.message });
  }
}
