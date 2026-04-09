// lib/db.js
// Neon serverless database connection
// Uses the DATABASE_URL environment variable set in Vercel

import { neon } from '@neondatabase/serverless';

let sql;

export function getDb() {
  if (!sql) {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    sql = neon(process.env.DATABASE_URL);
  }
  return sql;
}

// Initialize all tables — called once on first deploy
export async function initDb() {
  const sql = getDb();

  await sql`
    CREATE TABLE IF NOT EXISTS participants (
      id              SERIAL PRIMARY KEY,
      session_id      VARCHAR(60)  NOT NULL DEFAULT '',
      first_name      VARCHAR(100) NOT NULL DEFAULT '',
      last_name       VARCHAR(100) NOT NULL DEFAULT '',
      contact         VARCHAR(200) NOT NULL DEFAULT '',
      store_code      VARCHAR(100) NOT NULL DEFAULT '',
      store_name      VARCHAR(200) NOT NULL DEFAULT '',
      score           SMALLINT     NOT NULL DEFAULT 0,
      total_questions SMALLINT     NOT NULL DEFAULT 3,
      score_pct       VARCHAR(10)  NOT NULL DEFAULT '0%',
      won             VARCHAR(10)  NOT NULL DEFAULT 'Lost',
      prize_type      VARCHAR(100) NOT NULL DEFAULT '',
      prize_value     VARCHAR(200) NOT NULL DEFAULT '',
      start_time      VARCHAR(40)  NOT NULL DEFAULT '',
      end_time        VARCHAR(40)  NOT NULL DEFAULT '',
      duration_sec    INT          NOT NULL DEFAULT 0,
      latitude        VARCHAR(20)  NOT NULL DEFAULT '',
      longitude       VARCHAR(20)  NOT NULL DEFAULT '',
      location_accuracy VARCHAR(20) NOT NULL DEFAULT '',
      answers_detail  TEXT,
      ip_address      VARCHAR(60)  NOT NULL DEFAULT '',
      user_agent      VARCHAR(300) NOT NULL DEFAULT '',
      created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `;

  await sql`
    CREATE TABLE IF NOT EXISTS store_codes (
      id         SERIAL PRIMARY KEY,
      code       VARCHAR(100) NOT NULL UNIQUE,
      name       VARCHAR(200) NOT NULL DEFAULT '',
      active     BOOLEAN      NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
    )
  `;

  // Insert demo codes only if table is empty
  await sql`
    INSERT INTO store_codes (code, name)
    VALUES ('DEMO-001', 'Demo Store')
    ON CONFLICT (code) DO NOTHING
  `;

  return true;
}
